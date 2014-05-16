"use strict";

(function() {
  var DataStream = require('./DataStream');
  var ColumnSpec = require('./ColumnSpec');
  var TypeSpec = require('./TypeSpec');
  
  /**
   * Rows class
   */
  var Rows = function(data) {
    this.columns = [];
    this.rowCount = 0;
    this.columnCount = 0;
    this._current = 0;
    this.rows = [];
    var flags = data.readInt();
    this.columnCount = data.readInt();
    if (flags & 0x0001) {
      // Keyspace and tablename are specified globally.
      var keyspace = data.readString();
      var tablename = data.readString();
    }
    else {
      var keyspace = null;
      var tablename = null;
    }
    for (var i = 0; i < this.columnCount; ++i) {
      this.columns.push(new ColumnSpec(data, keyspace, tablename));
    }
    this.rowCount = data.readInt();
    for (var i = 0; i < this.rowCount; ++i) {
      var row = [], value;
      for (var j = 0; j < this.columnCount; ++j) {
        try {
          value = data.readBytes();
        }
        catch (error) {
          value = null;
        }
        row.push(value);
      }
      this.rows.push(row);
    }
  };
  
  Rows.prototype.getColumns = function() {
    return this.columns;
  };
  
  Rows.prototype.count = function() {
    return this.rowCount;
  };
  
  Rows.prototype.current = function() {
    if (typeof this.rows[this._current] === 'undefined') {
      throw Error('Invalid position');
    }
    var row = this.rows[this._current];
    var object = {};
    for (var i = 0; i < this.columnCount; ++i) {
      var value;
      var name = this.columns[i].getName();
      try {
        var data = new DataStream(this.rows[this._current][i]);
        object[name] = data.readByType(this.columns[i].getType());
      }
      catch (error) {
        object[name] = null;
      }
    }
    return object;
  };
  
  Rows.prototype.key = function() {
    return this._current;
  };
  
  Rows.prototype.next = function() {
    ++this._current;
  };
  
  Rows.prototype.rewind = function() {
    this._current = 0;
  };
  
  Rows.prototype.valid = function() {
    return this._current < this.rowCount;
  };
  
  Rows.prototype.toArray = function() {
    var rows = [];
    this._current = 0;
    while (this._current < this.rowCount) {
      rows.push(this.current());
      ++this._current;
    }
    return rows;
  };
  
  Rows.prototype.getColumn = function(name) {
    var items = [];
    this._current = 0;
    while (this._current < this.rowCount) {
      var row = this.current();
      items.push(row[name]);
      ++this._current;
    }
    return items;
  };
  
  module.exports = Rows;
}).call(this);
