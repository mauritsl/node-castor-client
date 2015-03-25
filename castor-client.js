/* jshint -W097 */
"use strict";

var GenericPool = require('generic-pool');
var Q = require('q');

var Transport = require('./classes/Transport');
var Query = require('./classes/Query');
var Get = require('./classes/Get');
var Set = require('./classes/Set');
var Del = require('./classes/Del');
var Schema = require('./classes/Schema');

var pools = {};

/**
 * Castor class.
 */
function Castor(host, keyspace, parent, deriveSchema) {
  this._keyspace = keyspace;
  this._host = host;
  
  // Check if we should derive the connection from the parent.
  // @see Castor.use()
  if (parent instanceof Castor) {
    this._transport = parent._transport;
    if (deriveSchema) {
      this._schema = parent._schema;
    }
    else {
      var schemaDefer = Q.defer();
      this._loadSchema();
    }
  }
  else {
    this._load();
  }
}

Castor.prototype._load = function() {
  var self = this;
  
  // Transport is a promise before we are actually connected.
  // This allows us to queue queries using when().
  var transportDefer = Q.defer();
  this._transport = transportDefer.promise;
  var schemaDefer = Q.defer();
  this._schema = schemaDefer.promise;
  
  if (pools[this._host] === undefined) {
    // Create a new connection pool for the given host.
    pools[this._host] = GenericPool.Pool({
      create: function(callback) {
      var client = new Transport(self._host, function() {
          callback(null, client);
        });
      },
      validate: function(client) {
        return client.connected;
      },
      destroy: function(client) {
        client.destroy();
      },
      max: 20,
      min: 1,
      idleTimeoutMillis: 30000
    });
  }
  pools[this._host].acquire(function(err, client) {
    if (err) {
      throw err;
    }
    else {
      transportDefer.resolve(client);
      self._transport = client;
      self._loadSchema();
    }
  });
};

Castor.prototype._loadSchema = function() {
  var schemaDefer = Q.defer();
  this._schema = schemaDefer.promise;
  new Schema(this._transport, this._keyspace, 0x0004).read().then(function(schema) {
    schemaDefer.resolve(schema);
  }).fail(function(error) {
    schemaDefer.reject(error);
  });
};

// Define contants.
Castor.prototype.CONSISTENCY_ANY = 0x0000;
Castor.prototype.CONSISTENCY_ONE = 0x0001;
Castor.prototype.CONSISTENCY_TWO = 0x0002;
Castor.prototype.CONSISTENCY_THREE = 0x0003;
Castor.prototype.CONSISTENCY_QUORUM = 0x0004;
Castor.prototype.CONSISTENCY_ALL = 0x0005;
Castor.prototype.CONSISTENCY_LOCAL_QUORUM = 0x0006;
Castor.prototype.CONSISTENCY_EACH_QUORUM = 0x0007;
Castor.prototype.CONSISTENCY_LOCAL_ONE = 0x0010;

Castor.prototype.use = function(keyspace, deriveSchema) {
  if (keyspace === this._keyspace) {
    // Shortcut if we switch to the current keyspace.
    return this;
  }
  deriveSchema = typeof deriveSchema === 'undefined' ? false : deriveSchema;
  return new Castor(this._host, keyspace, this, deriveSchema);
};

Castor.prototype.query = function(cql) {
  var output = new Query(this._transport, cql);
  return output;
};

Castor.prototype.get = function(table) {
  var output = new Get(this._transport, this._schema, this._keyspace, table);
  return output;
};

Castor.prototype.set = function(table) {
  var output = new Set(this._transport, this._schema, this._keyspace, table);
  return output;
};

Castor.prototype.del = function(table) {
  var output = new Del(this._transport, this._schema, this._keyspace, table);
  return output;
};

Castor.prototype.schema = function(table) {
  return Q.when(this._schema).then(function(schema) {
    if (typeof table === 'undefined') {
      return schema;
    }
    else {
      return schema[table];
    }
  });
};

Castor.prototype.reloadSchema = function() {
  this._schema = new Schema(this._transport, this._keyspace, 0x0004).read();
  return this._schema;
};

Castor.prototype.uuid = function() {
  return ("" + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/1|0/g, function() {
    return (0 | Math.random() * 16).toString(16);
  });
};

module.exports = Castor;
