"use strict";

(function() {
  var Bignum = require('bignum');
  var moment = require('moment');
  var TypeSpec = require('./TypeSpec');
  
  /**
   * DataStream class
   */
  var DataStream = function(data) {
    this.data = data;
    this.length = data.length;
    this.position = 0;
  };
  
  DataStream.prototype.read = function(length) {
    if (this.position + length > this.length) {
      throw Error('Reading while at end of stream');
    }
    var output = this.data.slice(this.position, this.position + length);
    this.position += length;
    return output;
  };
  
  DataStream.prototype.readChar = function() {
    var output = this.data.readUInt8(this.position);
    ++this.position;
    return output;
  };
  
  DataStream.prototype.readShort = function() {
    var output = this.data.readUInt16BE(this.position);
    this.position += 2;
    return output;
  };
  
  DataStream.prototype.readInt = function() {
    var output = this.data.readUInt32BE(this.position);
    this.position += 4;
    return output;
  };
  
  DataStream.prototype.readString = function() {
    var length = this.readShort();
    return this.read(length).toString();
  };
  
  DataStream.prototype.readLongString = function() {
    var length = this.readInt();
    return this.read(length).toString();
  };
  
  DataStream.prototype.readBytes = function() {
    var length = this.readInt();
    return this.read(length);
  };
  
  DataStream.prototype.readUuid = function() {
    var uuid = '';
    var data = this.read(16);
    for (var i = 0; i < 16; ++i) {
      if (i === 4 || i === 6 || i === 8 || i === 10) {
        uuid = uuid + '-';
      }
      uuid = uuid + data.slice(i, i + 1).toString('hex');
    }
    return uuid;
  };
  
  DataStream.prototype.readTimestamp = function() {
    return moment.unix(this.readInt() * 4294967.296 + (this.readInt() / 1000)).format();
  };
  
  DataStream.prototype.readList = function(valueType) {
    var list = [];
    var count = this.readShort();
    for (var i = 0; i < count; ++i) {
      var length = this.readShort();
      var data = new DataStream(this.read(length));
      list.push(data.readByType(valueType));
    }
    return list;
  };
  
  DataStream.prototype.readMap = function(keyType, valueType) {
    var map = {};
    var count = this.readShort();
    for (i = 0; i < count; ++i) {
      var key = this.readByType(keyType);
      map[key] = this.readByType(valueType);
    }
    return map;
  };
  
  DataStream.prototype.readFloat = function() {
    var output = this.data.readFloatBE(this.position);
    this.position += 4;
    return output;
  };
  
  DataStream.prototype.readDouble = function() {
    var output = this.data.readFloatBE(this.position);
    this.position += 8;
    return output;
  };
  
  DataStream.prototype.readBoolean = function() {
    return this.readChar() ? true : false;
  };
  
  DataStream.prototype.readInet = function() {
    if (this.data.length === 4) {
      // IPv4
      var inet = [];
      for (var i = 0; i < 4; ++i) {
        inet.push(this.readChar());
      }
      return inet.join('.');
    }
    if (this.data.length == 16) {
      // IPv6
      var parts = [];
      var empty = 0;
      for (var i = 0; i < 8; ++i) {
        var part = new Buffer(2);
        part.writeUInt16BE(this.readShort(), 0)
        part = part.toString('hex').replace(/^0+(.)$/, '$1');
        if (empty < 2 && part === '0') {
          if (empty == 0) {
            empty = 1;
            parts.push('');
          }
        }
        else {
          empty = empty == 1 ? 2 : empty;
          parts.push(part.replace(/^0+(.+)$/, '$1'));
        }
      }
      return parts.join(':');
    }
  };
  
  DataStream.prototype.readVarint = function() {
    var bignum = Bignum.fromBuffer(this.data);
    if (this.data.readInt8(0) & 0x80) {
      bignum = bignum.sub(Bignum.pow(2, 8 * this.data.length));
    }
    return bignum.toString();
  };
  
  DataStream.prototype.readDecimal = function() {
    var scale = this.data.readUInt32BE(0);
    this.data = this.data.slice(4);
    var value = new Buffer(this.readVarint());
    value = Buffer.concat([
      value.slice(0, value.length - scale),
      new Buffer('.'),
      value.slice(value.length - scale)
    ]).toString();
    if (value === '') {
      value = '0';
    }
    return value.replace('-.', '-0.');
  };

  DataStream.prototype.readByType = function(type) {
    switch (type.getType()) {
      case TypeSpec.CUSTOM:
        // @todo
        break;
      case TypeSpec.ASCII:
      case TypeSpec.VARCHAR:
      case TypeSpec.TEXT:
        return this.data.toString();
      case TypeSpec.BIGINT:
      case TypeSpec.COUNTER:
      case TypeSpec.VARINT:
        return this.readVarint();
      case TypeSpec.BLOB:
        return this.data;
      case TypeSpec.BOOLEAN:
        return this.readBoolean();
      case TypeSpec.DECIMAL:
        return this.readDecimal();
      case TypeSpec.DOUBLE:
        return this.readDouble();
      case TypeSpec.FLOAT:
        return this.readFloat();
      case TypeSpec.INT:
        return this.readInt();
      case TypeSpec.TIMESTAMP:
        return this.readTimestamp();
      case TypeSpec.UUID:
        return this.readUuid();
      case TypeSpec.TIMEUUID:
        return this.readUuid();
      case TypeSpec.INET:
        return this.readInet();
        break;
      case TypeSpec.COLLECTION_LIST:
      case TypeSpec.COLLECTION_SET:
        return this.readList(type.getValueType());
      case TypeSpec.COLLECTION_MAP:
        return this.readMap(type.getKeyType(), type.getValueType());
    }
  }
  
  module.exports = DataStream;
}).call(this);
