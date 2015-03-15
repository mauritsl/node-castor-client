/* jshint -W097 */
"use strict";

/**
 * TypeSpec class
 */
var TypeSpec = function(data) {
  this.type = data.readShort();
  switch (this.type) {
    case this.CUSTOM:
      this.customTypename = data.readString();
      break;
    case this.COLLECTION_LIST:
    case this.COLLECTION_SET:
      this.valueType = new TypeSpec(data);
      break;
    case this.COLLECTION_MAP:
      this.keyType = new TypeSpec(data);
      this.valueType = new TypeSpec(data);
      break;
  }
};

TypeSpec.prototype.getType = function() {
  return this.type;
};

TypeSpec.prototype.getCustomTypename = function() {
  return this.customTypename;
};

TypeSpec.prototype.getKeyType = function() {
  return this.keyType;
};

TypeSpec.prototype.getValueType = function() {
  return this.valueType;
};

TypeSpec.prototype.getTypeName = function() {
  var names = {};
  names[this.CUSTOM] = 'custom';
  names[this.ASCII] = 'ascii';
  names[this.BIGINT] = 'bigint';
  names[this.BLOB] = 'blob';
  names[this.BOOLEAN] = 'boolean';
  names[this.COUNTER] = 'counter';
  names[this.DECIMAL] = 'decimal';
  names[this.DOUBLE] = 'double';
  names[this.FLOAT] = 'float';
  names[this.INT] = 'int';
  names[this.TEXT] = 'text';
  names[this.TIMESTAMP] = 'timestamp';
  names[this.UUID] = 'uuid';
  names[this.VARCHAR] = 'varchar';
  names[this.VARINT] = 'varint';
  names[this.TIMEUUID] = 'timeuuid';
  names[this.INET] = 'inet';
  names[this.COLLECTION_LIST] = 'list';
  names[this.COLLECTION_MAP] = 'map';
  names[this.COLLECTION_SET] = 'set';
  if (typeof names[this.type] !== 'undefined') {
    return names[this.type];
  }
};

TypeSpec.prototype.toString = function() {
  var valueType, keyType;
  switch (this.type) {
    case this.COLLECTION_LIST:
      valueType = this.valueType.toString();
      return 'list<' + valueType + '>';
    case this.COLLECTION_SET:
      valueType = this.valueType.toString();
      return 'set<' + valueType + '>';
    case this.COLLECTION_MAP:
      keyType = this.keyType.toString();
      valueType = this.valueType.toString();
      return 'map<' + keyType + ',' + valueType + '>';
    default:
      return this.getTypeName();
  }
};

// Define constants.
TypeSpec.CUSTOM = 0x0000;
TypeSpec.ASCII = 0x0001;
TypeSpec.BIGINT = 0x0002;
TypeSpec.BLOB = 0x0003;
TypeSpec.BOOLEAN = 0x0004;
TypeSpec.COUNTER = 0x0005;
TypeSpec.DECIMAL = 0x0006;
TypeSpec.DOUBLE = 0x0007;
TypeSpec.FLOAT = 0x0008;
TypeSpec.INT = 0x0009;
TypeSpec.TEXT = 0x000A;
TypeSpec.TIMESTAMP = 0x000B;
TypeSpec.UUID = 0x000C;
TypeSpec.VARCHAR = 0x000D;
TypeSpec.VARINT = 0x000E;
TypeSpec.TIMEUUID = 0x000F;
TypeSpec.INET = 0x0010;
TypeSpec.COLLECTION_LIST = 0x0020;
TypeSpec.COLLECTION_MAP = 0x0021;
TypeSpec.COLLECTION_SET = 0x0022;

// These contants must be available on the TypeSpec instance too. They can
// be used by the applications using castor client.
TypeSpec.prototype.CUSTOM = 0x0000;
TypeSpec.prototype.ASCII = 0x0001;
TypeSpec.prototype.BIGINT = 0x0002;
TypeSpec.prototype.BLOB = 0x0003;
TypeSpec.prototype.BOOLEAN = 0x0004;
TypeSpec.prototype.COUNTER = 0x0005;
TypeSpec.prototype.DECIMAL = 0x0006;
TypeSpec.prototype.DOUBLE = 0x0007;
TypeSpec.prototype.FLOAT = 0x0008;
TypeSpec.prototype.INT = 0x0009;
TypeSpec.prototype.TEXT = 0x000A;
TypeSpec.prototype.TIMESTAMP = 0x000B;
TypeSpec.prototype.UUID = 0x000C;
TypeSpec.prototype.VARCHAR = 0x000D;
TypeSpec.prototype.VARINT = 0x000E;
TypeSpec.prototype.TIMEUUID = 0x000F;
TypeSpec.prototype.INET = 0x0010;
TypeSpec.prototype.COLLECTION_LIST = 0x0020;
TypeSpec.prototype.COLLECTION_MAP = 0x0021;
TypeSpec.prototype.COLLECTION_SET = 0x0022;


module.exports = TypeSpec;
