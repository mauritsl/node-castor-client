"use strict";

(function() {
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
    this.name = data.readString();
    this.type = new TypeSpec(data);
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
}).call(this);
