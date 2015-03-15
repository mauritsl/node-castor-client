/* jshint -W097 */
"use strict";

var TypeSpec = require('./TypeSpec');

/**
 * Field class
 */
var Field = function(name, type, value, operator) {
  this.name = name;
  this._type = type;
  this.value = value;
  this._operator = operator;
};

Field.prototype.toString = function() {
  return this.name.toString() + ' ' + this._operator + ' ' + this.getValueString();
};

Field.prototype.getValueString = function() {
  if (this.value === null) {
    // All field types can be null.
    return 'NULL';
  }
  switch (this._type.type) {
    case TypeSpec.CUSTOM:
      throw Error('Custom column type not supported');
    case TypeSpec.ASCII:
    case TypeSpec.TEXT:
    case TypeSpec.VARCHAR:
      return this.getString();
    case TypeSpec.BIGINT:
    case TypeSpec.INT:
    case TypeSpec.VARINT:
    case TypeSpec.COUNTER:
      return this.getInt();
    case TypeSpec.BLOB:
      return this.getBlob();
    case TypeSpec.BOOLEAN:
      return this.getBoolean();
    case TypeSpec.DECIMAL:
    case TypeSpec.DOUBLE:
    case TypeSpec.FLOAT:
      return this.getDouble();
    case TypeSpec.TIMESTAMP:
      return this.getTimestamp();
    case TypeSpec.UUID:
    case TypeSpec.TIMEUUID:
      return this.getUUID();
    case TypeSpec.INET:
      return this.getInet();
    case TypeSpec.COLLECTION_LIST:
      return this.getList();
    case TypeSpec.COLLECTION_MAP:
      return this.getMap();
    case TypeSpec.COLLECTION_SET:
      return this.getSet();
  }
  throw Error('Unknown type');
};

Field.prototype.getString = function() {
  this.value = this.value.toString();
  return '\'' + this.value.split("'").join("''") + '\'';
};

Field.prototype.getInt = function() {
  if (this.value.toString().match(/^\-?[0-9]+$/)) {
    return this.value;
  }
  else {
    throw Error('Invalid value for field ' + this.name);
  }
};

Field.prototype.getBlob = function() {
  if (typeof this.value === 'string' || this.value instanceof Buffer) {
    return '0x' + new Buffer(this.value).toString('hex');
  }
  else {
    throw Error('Invalid value for field ' + this.name);
  }
};

Field.prototype.getBoolean = function() {
  if (typeof this.value === 'boolean') {
    return this.value ? 'true' : 'false';
  }
  else {
    throw Error('Invalid value for field ' + this.name);
  }
};

Field.prototype.getDouble = function() {
  if (typeof this.value === 'number') {
    return this.value.toString();
  }
  else {
    throw Error('Invalid value for field ' + this.name);
  }
};

Field.prototype.getTimestamp = function() {
  if (typeof this.value === 'string') {
    var isDate = this.value.match(/^[0-9]{4}\-[012][0-9]\-[0-3][0-9]$/);
    var isDateTime = this.value.match(/^[0-9]{4}\-[012][0-9]\-[0-3][0-9]T[0-2][0-9]\:[0-5][0-9]\:[0-5][0-9](\.[0-9]+)?(Z|[\+\-][012][0-9]\:[0-5][0-9])?$/);
    if (!isDate && !isDateTime) {
      throw Error('Invalid value for field ' + this.name);
    }
    if (this.value.substring(0, 10) === '0000-00-00') {
      return 'NULL';
    }
    return "'" + this.value + "'";
  }
  else if (this.value instanceof Date) {
    return "'" + this.value.toISOString().substring(0, 19) + "'";
  }
  throw Error('Unrecognized value type for field ' + this.name);
};

Field.prototype.getUUID = function() {
  if (typeof this.value !== 'string') {
    throw Error('Invalid value for field ' + this.name);
  }
  var uuid = this.value.toLowerCase();
  if (uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
    return uuid;
  }
  else {
    throw Error('Invalid format for field ' + this.name);
  }
};

Field.prototype.getInet = function() {
  return this.getString();
};

Field.prototype.getList = function() {
  var self = this;
  if (typeof this.value !== 'object' || !(this.value instanceof Array)) {
    throw Error('Invalid value for field ' + this.name);
  }
  var items = [];
  this.value.forEach(function(value) {
    var field = new Field(self.name, self._type.valueType, value);
    items.push(field.getValueString());
  });
  return '[' + items.join(',') + ']';
};

Field.prototype.getMap = function() {
  var self = this;
  if (typeof this.value !== 'object') {
    throw Error('Invalid value for field ' + this.name);
  }
  var map = [];
  Object.keys(this.value).forEach(function(keyValue) {
    var field, key, value;
    field = new Field(self.name, self._type.keyType, keyValue);
    key = field.getValueString();
    field = new Field(self.name, self._type.valueType, self.value[keyValue]);
    value = field.getValueString();
    map.push(key + ':' + value);
  });
  return '{' + map.join(',') + '}';
};

Field.prototype.getSet = function() {
  var self = this;
  if (typeof this.value !== 'object' || !(this.value instanceof Array)) {
    throw Error('Invalid value for field ' + this.name);
  }
  var items = [];
  this.value.forEach(function(value) {
    var field = new Field(self.name, self._type.valueType, value);
    items.push(field.getValueString());
  });
  return '{' + items.join(',') + '}';
};

module.exports = Field;
