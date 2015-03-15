/* jshint -W097 */
"use strict";

var Q = require('q');
var Query = require('./Query');
var TypeSpec = require('./TypeSpec');
var DataStream = require('./DataStream');

/**
 * Schema class
 */
var Schema = function(transport, keyspace, consistency) {
  this._transport = transport;
  this._keyspace = keyspace;
  this._consistency = consistency;
};

Schema.prototype.read = function() {
  var self = this;
  var cql = 'SELECT columnfamily_name, column_name, type, validator FROM system.schema_columns WHERE keyspace_name = \'' + this._keyspace + '\'';
  var query = new Query(this._transport, cql, this._consistency);
  this._schema = query.then(function(rows) {
    var schema = {};
    while (rows.valid()) {
      var row = rows.current();
      if (typeof schema[row.columnfamily_name] === 'undefined') {
        schema[row.columnfamily_name] = {keys: [], values: [], columns: {}};
      }
      var columnFamily = schema[row.columnfamily_name];
      if (row.type === 'partition_key' || row.type === 'clustering_key') {
        columnFamily.keys.push(row.column_name);
      }
      else {
        columnFamily.values.push(row.column_name);
      }
      columnFamily.columns[row.column_name] = self.translateType(row.validator);
      rows.next();
    }
    self._schema = schema;
    return schema;
  });
  return this._schema;
};

Schema.prototype.translateType = function(validator) {
  validator = validator.split('org.apache.cassandra.db.marshal.').join('');
  var baseType = validator.split('(')[0];
  var types = {
    'AsciiType': TypeSpec.ASCII,
    'LongType': TypeSpec.BIGINT,
    'BytesType': TypeSpec.BLOB,
    'BooleanType': TypeSpec.BOOLEAN,
    'CounterColumnType': TypeSpec.COUNTER,
    'DecimalType': TypeSpec.DECIMAL,
    'DoubleType': TypeSpec.DOUBLE,
    'FloatType': TypeSpec.FLOAT,
    'Int32Type': TypeSpec.INT,
    'DateType': TypeSpec.TIMESTAMP,
    'TimestampType': TypeSpec.TIMESTAMP,
    'UUIDType': TypeSpec.UUID,
    'LexicalUUIDType': TypeSpec.UUID,
    'UTF8Type': TypeSpec.VARCHAR,
    'IntegerType': TypeSpec.VARINT,
    'TimeUUIDType': TypeSpec.TIMEUUID,
    'InetAddressType': TypeSpec.INET,
    'ListType': TypeSpec.COLLECTION_LIST,
    'MapType': TypeSpec.COLLECTION_MAP,
    'SetType': TypeSpec.COLLECTION_SET
  };
  if (typeof types[baseType] === 'undefined') {
    throw Error('Unknown type ' + baseType);
  }
  baseType = types[baseType];
  var type = new Buffer(2);
  type.writeUInt16BE(baseType, 0);
  var keyType, valueType;
  if (baseType == TypeSpec.COLLECTION_LIST || baseType == TypeSpec.COLLECTION_SET) {
    valueType = validator.split('(')[1].split(')')[0];
    type = new Buffer(4);
    type.writeUInt16BE(baseType, 0);
    type.writeUInt16BE(types[valueType], 2);
  }
  if (baseType == TypeSpec.COLLECTION_MAP) {
    keyType = validator.split('(')[1].split(')')[0].split(',')[0];
    valueType = validator.split('(')[1].split(')')[0].split(',')[1];
    type = new Buffer(6);
    type.writeUInt16BE(baseType, 0);
    type.writeUInt16BE(types[keyType], 2);
    type.writeUInt16BE(types[valueType], 4);
  }
  type = new DataStream(type);
  return new TypeSpec(type);
};

Schema.prototype.get = function(columnFamily) {
  if (typeof columnFamily === 'undefined') {
    return this._schema;
  }
  if (typeof this._schema[columnFamily] === 'undefined') {
    throw Error('Unknown columnfamily: ' + columnFamily);
  }
  return this._schema[columnFamily];
};

module.exports = Schema;
