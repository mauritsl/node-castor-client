"use strict";

var Q = require('q');
var Query = require('./Query');
var Field = require('./Field');
var Schema = require('./Schema');

/**
 * Set class
 * 
 * Usage example:
 * 
 * castor.set('table')
 *   .key('name', 'uuid', '...')
 *   .field('name', 'int', 34)
 *   .incr('name')
 *   .decr('name')
 *   .consistency(castor.CONSISTENCY_QUORUM)
 * .then(...
 */
var Set = function(transport, schema, keyspace, table) {
  this._transport = transport;
  this._schema = schema.get(table);
  this._keyspace = keyspace;
  this._table = table;
  this._update = [];
  this._fields = [];
  this._keys = [];
  this._increments = [];
  this._consistency = 0x0004;
};

Set.prototype.field = function(name, value) {
  if (typeof value !== 'undefined') {
    // Ignore undefined values, to allow easier implementation of REST PATCH calls.
    this._update.push({field: name, value: value});
  }
  return this;
};

Set.prototype.incr = function(name, amount) {
  this._increments.push({field: name, amount: amount === undefined ? 1 : amount});
  return this;
};

Set.prototype.decr = function(name, amount) {
  this.incr(name, amount === undefined ? -1 : 0 - amount);
  return this;
};

Set.prototype.consistency = function(consistency) {
  this._consistency = consistency;
  return this;
};

Set.prototype.execute = function() {
  var self = this;
  return Q.when(this._schema).then(function(schema) {
    self._update.forEach(function(update) {
      if (typeof schema.columns[update.field] === 'undefined') {
        throw Error('Unknown field ' + update.field);
      }
      if (typeof update.value !== 'undefined') {
        var key = false;
        schema.keys.forEach(function(name) {
          if (update.field === name) {
            key = true;
          }
        });
        var field = new Field(update.field, schema.columns[update.field], update.value, '=');
        if (key) {
          self._keys.push(field);
        }
        else {
          self._fields.push(field);
        }
      }
    });
    
    // INSERT and UPDATE queries in Cassandra are more or less interchangable.
    // However, we cannot formulate an UPDATE query when only the primary key
    // fields are given, and we cannot formulate an INSERT query when increments
    // are used. Use INSERT syntax only for the latter case. We prefer the
    // slightly shorter UPDATE syntax when both are possible.
    if (self._fields.length || self._increments.length) {
      var cql = self._toUpdateQuery();
    }
    else {
      var cql = self._toInsertQuery();
    }
    return new Query(self._transport, cql, self._consistency).execute();
  });
};

Set.prototype.then = function(callback) {
  return this.execute().then(callback);
};

Set.prototype._toInsertQuery = function() {
  var names = [];
  var values = [];
  this._keys.forEach(function(key) {
    names.push(key.name.toString());
    values.push(key.getValueString());
  });
  var cql = 'INSERT INTO ' + this._keyspace + '.' + this._table
    + ' (' + names.join(', ') + ')'
    + ' VALUES'
    + ' (' + values.join(', ') + ')';
  return cql;
};

Set.prototype._toUpdateQuery = function() {
  var fields = [];
  this._fields.forEach(function(field) {
    fields.push(field.toString());
  });
  var keys = [];
  this._keys.forEach(function(key) {
    keys.push(key.toString());
  });
  this._increments.forEach(function(increment) {
    fields.push(increment.field + ' = ' + increment.field + ' + ' + increment.amount);
  });
  var cql = 'UPDATE ' + this._keyspace + '.' + this._table
    + ' SET ' + fields.join(', ')
    + ' WHERE ' + keys.join(' AND ');
  return cql;
};

module.exports = Set;
