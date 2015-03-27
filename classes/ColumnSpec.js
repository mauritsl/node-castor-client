/* jshint -W097 */
"use strict";

var TypeSpec = require('./TypeSpec');

/**
 * ColumnSpec class
 */
var ColumnSpec = function(data, keyspace, tablename) {
  if (keyspace === null) {
    this.keyspace = data.readString();
    this.tablename = data.readString();
  }
  else {
    this.keyspace = keyspace;
    this.tablename = tablename;
  }
  if (data.data instanceof Buffer) {
    this.name = data.readString();
    this.type = new TypeSpec(data);
  }
  else {
    this.name = data.name;
    this.type = data.type;
  }
};

ColumnSpec.prototype.prefix = function(prefix) {
  this.name = prefix + this.name;
};

ColumnSpec.prototype.getKeyspace = function() {
  return this.keyspace;
};

ColumnSpec.prototype.getTablename = function() {
  return this.tablename;
};

ColumnSpec.prototype.getName = function() {
  return this.name;
};

ColumnSpec.prototype.getType = function() {
  return this.type;
};

ColumnSpec.prototype.toString = function() {
  return this.name + ' ' + this.type.toString();
};

module.exports = ColumnSpec;
