"use strict";

(function() {
  /**
   * TypeSpec class
   */
  var TypeSpec = function(data) {
    this.type = data.readShort();
    switch (this.type) {
      case TypeSpec.CUSTOM:
        this.customTypename = data.readString();
        break;
      case TypeSpec.COLLECTION_LIST:
      case TypeSpec.COLLECTION_SET:
        this.valueType = new TypeSpec(data);
        break;
      case TypeSpec.COLLECTION_MAP:
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
    names[TypeSpec.CUSTOM] = 'custom';
    names[TypeSpec.ASCII] = 'ascii';
    names[TypeSpec.BIGINT] = 'bigint';
    names[TypeSpec.BLOB] = 'blob';
    names[TypeSpec.BOOLEAN] = 'boolean';
    names[TypeSpec.COUNTER] = 'counter';
    names[TypeSpec.DECIMAL] = 'decimal';
    names[TypeSpec.DOUBLE] = 'double';
    names[TypeSpec.FLOAT] = 'float';
    names[TypeSpec.INT] = 'int';
    names[TypeSpec.TEXT] = 'text';
    names[TypeSpec.TIMESTAMP] = 'timestamp';
    names[TypeSpec.UUID] = 'uuid';
    names[TypeSpec.VARCHAR] = 'varchar';
    names[TypeSpec.VARINT] = 'varint';
    names[TypeSpec.TIMEUUID] = 'timeuuid';
    names[TypeSpec.INET] = 'inet';
    names[TypeSpec.COLLECTION_LIST] = 'list';
    names[TypeSpec.COLLECTION_MAP] = 'map';
    names[TypeSpec.COLLECTION_SET] = 'set';
    if (typeof names[this.type] !== 'undefined') {
      return names[this.type];
    }
  };

  TypeSpec.prototype.toString = function() {
    switch (this.type) {
      case TypeSpec.COLLECTION_LIST:
        var valueType = this.valueType.toString();
        return 'list<' + valueType + '>';
      case TypeSpec.COLLECTION_SET:
        var valueType = this.valueType.toString();
        return 'set<' + valueType + '>';
      case TypeSpec.COLLECTION_MAP:
        var keyType = this.keyType.toString();
        var valueType = this.valueType.toString();
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
  
  module.exports = TypeSpec;
}).call(this);
