"use strict";

var Q = require('q');
var DataStream = require('./DataStream');
var Rows = require('./Rows');
var Transport = require('./Transport');

/**
 * Query class
 * 
 * Usage example:
 * 
 * castor.query('...')
 *   .cache(60)
 *   .consistency(castor.CONSISTENCY_QUORUM)
 * .then(...
 */
var Query = function(transport, cql, consistency) {
  if (typeof consistency === 'undefined') {
    consistency = 0x0004;
  }
  this._transport = transport;
  this._cql = cql;
  this._consistency = consistency;
};

Query.prototype.consistency = function(consistency) {
  this._consistency = consistency;
  return this;
};

Query.prototype.execute = function(defer) {
  if (typeof defer === 'undefined') {
    var defer = Q.defer();
  }
  var self = this;
  
  var length = Buffer.byteLength(this._cql, 'utf8');
  var body = new Buffer(6 + length);
  body.writeUInt32BE(length, 0);
  new Buffer(this._cql).copy(body, 4);
  body.writeUInt16BE(this._consistency, 4 + length);
  
  Q.when(this._transport, function(transport) {
    transport.sendFrame(Transport.QUERY, body).then(function(data) {
      data = new DataStream(data);
      var kind = data.readInt();
      switch (kind) {
        // Void
        case 0x0001:
          defer.resolve(true);
          break;
        // Rows
        case 0x0002:
          defer.resolve(new Rows(data));
          break;
        // Set keyspace
        case 0x0003:
          defer.resolve(true);
          break;
        // Prepared
        case 0x0004:
          defer.resolve(true);
          break;
        // Schema change
        case 0x0005:
          defer.resolve(true);
          break;
        default:
          defer.reject('Unknown response from server');
      }
    }).fail(function(error) {
      if (typeof error.stack !== 'undefined') {
        console.log(error.stack);
      }
      console.log('Query error: ' + error.message + "\n" + self._cql);
      defer.reject(error);
    });
  });
  
  return defer.promise;
};

Query.prototype.then = function(callback) {
  return this.execute().then(callback);
};

module.exports = Query;
