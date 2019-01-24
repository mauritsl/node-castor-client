/* jshint -W097 */
"use strict";

var castor = require('../castor-client');
var crypto = require('crypto');
var Q = require('q');
var Query = require('./Query');
var Field = require('./Field');
var Schema = require('./Schema');
var ColumnSpec = require('./ColumnSpec');
var TypeSpec = require('./TypeSpec');
var bignum = require('./Bignum');

/**
 * Get class
 *
 * Usage example:
 *
 * castor.get('table')
 *   .fields(['field', 'field'])
 *   .filter('field', 'uuid', '...')
 *   .orderBy('field', 'asc')
 *   .limit(10)
 *   .cache(60)
 *   .consistency(castor.CONSISTENCY_QUORUM)
 * .then(...
 */
var Get = function(transport, schema, keyspace, table) {
  this._transport = transport;
  this._schema = schema.get(table);
  this._schemaFull = schema;
  this._keyspace = keyspace;
  this._table = table;
  this._fields = [];
  this._filter = [];
  this._orderBy = null;
  this._orderByDirection = 'asc';
  this._limit = null;
  this._allowFiltering = false;
  this._consistency = 0x0004;
  this._joins = [];
  this._includeToken = false;
  this._fromToken = null;
};

Get.prototype.fields = function(fields) {
  this._fields = fields;
  return this;
};

Get.prototype.includeToken = function() {
  this._includeToken = true;
  return this;
};

Get.prototype.fromToken = function(token) {
  var value = token.toString();
  if (!value.match(/^\-?[0-9]+$/)) {
    throw Error('Invalid token: ' + token);
  }
  var big = bignum(value);
  if (big.gt(bignum.pow(2, 63).sub(1)) || big.lt(bignum(0).sub(bignum.pow(2, 63)))) {
    throw Error('Token is out of range');
  }
  this._fromToken = token;
  return this;
};

Get.prototype.filter = function(name, value, operator) {
  if (typeof operator === 'undefined') {
    operator = '=';
  }
  if (operator != '=' && operator != '<' && operator != '>' && operator != '<=' && operator != '>=') {
    throw Error('Unknown operator: ' + operator);
  }
  this._filter.push({name: name, value: value, operator: operator});
  return this;
};

Get.prototype.orderBy = function(name, direction) {
  this._orderBy = name;
  if (direction !== undefined) {
    this._orderByDirection = direction;
  }
  return this;
};

Get.prototype.limit = function(limit) {
  this._limit = limit;
  return this;
};

Get.prototype.allowFiltering = function(allow) {
  if (typeof allow === 'undefined') {
    allow = true;
  }
  this._allowFiltering = allow;
  return this;
};

Get.prototype.consistency = function(consistency) {
  this._consistency = consistency;
  return this;
};

Get.prototype.join = function(leftField, rightField, fields, prefix) {
  if (typeof prefix === 'undefined') {
    prefix = '';
  }
  // Right field is in format "table" or "table.field". The fieldname is
  // identical to the left field if not specified.
  var parts = rightField.split('.');
  var rightTable = parts[0];
  rightField = parts.length > 1 ? parts[1] : leftField;
  this._joins.push({
    leftField: leftField,
    rightTable: rightTable,
    rightField: rightField,
    fields: fields,
    prefix: prefix
  });
  return this;
};

Get.prototype.execute = function() {
  var self = this;
  return Q.when(this._schema).then(function(schema) {
    if (typeof schema === 'undefined') {
      throw Error('Unknown table ' + self._table);
    }
    var cql = 'SELECT ';
    if (self._fields.length) {
      cql = cql + self._fields.join(', ');
    }
    else {
      cql = cql + '*';
    }
    if (self._includeToken) {
      cql = cql + ', token(' + schema.keys.join(', ') + ') as "token"';
    }
    cql = cql + ' FROM ' + self._keyspace + '.' + self._table;
    if (self._filter.length) {
      for (var i = 0; i < self._filter.length; ++i) {
        var type = schema.columns[self._filter[i].name];
        if (typeof type === 'undefined') {
          throw Error('Unknown field ' + self._filter[i].name + ' in filter');
        }
        var filter = new Field(self._filter[i].name, type, self._filter[i].value, self._filter[i].operator);
        cql = cql + (i === 0 ? ' WHERE ' : ' AND ');
        cql = cql + filter.toString();
      }
    }
    if (self._fromToken !== null) {
      cql = cql + (self._filter.length ? ' AND ' : ' WHERE ');
      cql = cql + 'token(' + schema.keys.join(', ') + ') > ' + self._fromToken;
    }
    if (self._orderBy !== null) {
      cql = cql + ' ORDER BY ' + self._orderBy + ' ' + self._orderByDirection.toUpperCase();
    }
    if (self._limit !== null) {
      cql = cql + ' LIMIT ' + self._limit;
    }
    if (self._allowFiltering) {
      cql = cql + ' ALLOW FILTERING';
    }
    if (self._joins.length) {
      return self._executeWithJoins(cql);
    }
    else {
      return new Query(self._transport, cql, self._consistency).execute();
    }
  });
};

Get.prototype.then = function(callback) {
  return this.execute().then(callback);
};

Get.prototype._executeWithJoins = function(cql) {
  var self = this;
  var defer = Q.defer();
  new Query(self._transport, cql, self._consistency).then(function(rows) {
    // Execute joins in serial. Row iterating / rewinding will not work
    // as expected when executed in parallel and joins can depend on
    // preceding joins.
    var i = -1, next = function() {
      if (typeof self._joins[++i] === 'undefined') {
        defer.resolve(rows);
        return;
      }
      self._executeJoin(rows, self._joins[i]).then(function(result) {
        Object.keys(result.columns).forEach(function(column) {
          result.columns[column].prefix(self._joins[i].prefix);
          rows.addColumn(result.columns[column], result.values[column]);
        });
        next();
      }).fail(function(error) {
        defer.reject(error);
      }).done();
    };
    next();
  });
  return defer.promise;
};

Get.prototype._executeJoin = function(rows, join) {
  var self = this;
  var defer = Q.defer();
  var columns = {};
  var values = {};
  var next = function() {
    if (!rows.valid()) {
      rows.rewind();
      defer.resolve({columns: columns, values: values});
      return;
    }
    var row = rows.current();
    var leftFieldValue = row[join.leftField];
    if (typeof leftFieldValue === 'undefined') {
      defer.reject('Cannot join on unexisting field ' + join.leftField);
      return;
    }
    if (leftFieldValue === null) {
      // We cannot join if the value is null, but we have to fill up the empty columns.
      // The column specification must be derived from the schema, since we cannot
      // take this from the query results.
      self._schemaFull.get(join.rightTable).then(function(tableSchema) {
        join.fields.forEach(function(name) {
          if (typeof columns[name] === 'undefined') {
            var type = new TypeSpec(tableSchema.columns[name]);
            var column = new ColumnSpec({name: name, type: type}, self._keyspace, self._table);
            columns[name] = column;
            values[name] = [];
          }
          values[name].push(null);
        });
        rows.next();
        next();
      });
    }
    else {
      new Get(self._transport, self._schemaFull, self._keyspace, join.rightTable)
        .fields(join.fields)
        .filter(join.rightField, leftFieldValue)
        .limit(1)
      .then(function(joinedRows) {
        joinedRows.getColumns().forEach(function(column) {
          var name = column.getName();
          if (typeof columns[name] === 'undefined') {
            columns[name] = column;
            values[name] = [];
          }
        });
        if (joinedRows.valid()) {
          var joinedRow = joinedRows.current();
          Object.keys(joinedRow).forEach(function(key) {
            values[key].push(joinedRow[key]);
          });
        }
        else {
          // No valid row found.
          join.fields.forEach(function(field) {
            values[field].push(null);
          });
        }
        rows.next();
        next();
      }).fail(defer.reject).done();
    }
  };
  next();
  return defer.promise;
};

Get.prototype.signature = function() {
  var data = [
    this._fields,
    this._filter,
    this._joins,
    this._keyspace,
    this._limit,
    this._orderBy,
    this._orderByDirection,
    this._table
  ];
  data = JSON.stringify(data);
  return crypto.createHash('sha1').update(data).digest('hex');
};

module.exports = Get;
