/* jshint -W097 */
"use strict";

var castor = require('../castor-client');
var Q = require('q');
var Query = require('./Query');
var Field = require('./Field');
var Schema = require('./Schema');

/**
 * Del class
 * 
 * Usage example:
 * 
 * castor.del('table')
 *   .fields(['field', 'field'])
 *   .filter('field', 'uuid', '...')
 *   .consistency(castor.CONSISTENCY_QUORUM)
 * .then(...
 */
var Del = function(transport, schema, keyspace, table) {
  this._transport = transport;
  this._schema = schema.get(table);
  this._keyspace = keyspace;
  this._table = table;
  this._fields = [];
  this._filter = [];
  this._consistency = 0x0004;
};

Del.prototype.fields = function(fields) {
  this._fields = fields;
  return this;
};

Del.prototype.filter = function(name, value, operator) {
  if (typeof operator === 'undefined') {
    operator = '=';
  }
  if (operator != '=' && operator != '<' && operator != '>' && operator != '<=' && operator != '>=') {
    throw Error('Unknown operator: ' + operator);
  }
  this._filter.push({name: name, value: value, operator: operator});
  return this;
};

Del.prototype.consistency = function(consistency) {
  this._consistency = consistency;
  return this;
};

Del.prototype.execute = function() {
  var self = this;
  return Q.when(this._schema).then(function(schema) {
    var cql = 'DELETE ';
    if (self._fields.length) {
      cql = cql + self._fields.join(', ') + ' ';
    }
    else {
      cql = cql + '';
    }
    cql = cql + 'FROM ' + self._keyspace + '.' + self._table;
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
    return new Query(self._transport, cql, self._consistency).execute();
  });
};

Del.prototype.then = function(callback) {
  return this.execute().then(callback);
};

module.exports = Del;
