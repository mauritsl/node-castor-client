/* jshint -W097 */
"use strict";

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
  this._encoded = [];
  var flags = data.readInt();
  this.columnCount = data.readInt();
  var keyspace, tablename;
  if (flags & 0x0001) {
    // Keyspace and tablename are specified globally.
    keyspace = data.readString();
    tablename = data.readString();
  }
  else {
    keyspace = null;
    tablename = null;
  }
  var i;
  for (i = 0; i < this.columnCount; ++i) {
    this.columns.push(new ColumnSpec(data, keyspace, tablename));
    this._encoded.push(true);
  }
  this.rowCount = data.readInt();
  for (i = 0; i < this.rowCount; ++i) {
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
      if (this._encoded[i]) {
        var data = new DataStream(this.rows[this._current][i]);
        object[name] = data.readByType(this.columns[i].getType());
      }
      else {
        object[name] = this.rows[this._current][i];
      }
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

Rows.prototype.addColumn = function(columnSpec, values) {
  this.columns.push(columnSpec);
  this._encoded.push(false);
  for (var i = 0; i < values.length; ++i) {
    this.rows[i].push(values[i]);
  }
  ++this.columnCount;
};

module.exports = Rows;
