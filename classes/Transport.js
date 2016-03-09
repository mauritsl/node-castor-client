/* jshint -W097 */
"use strict";

var net = require('net');
var Q = require('q');
var Rows = require('./Rows');

/**
 * Transport class
 */
var Transport = function(host, readyCallback) {
  var self = this;
  
  // Used for validating the connection in the connection pool.
  this.ready = false;
  
  // Store incoming traffic in the input buffer.
  this._inputBuffer = new Buffer(0);
  
  // Promises for application requests.
  this._promises = {};
  
  // Current stream number.
  this._streamNumber = 0;
  
  // Queue for new requests waiting for stream number.
  this._streamQueue = [];
  
  // Validate hostname and extract port number (IPv4 or IPv6).
  var port = 9042;
  var parts = host.match(/^(?:([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)|\[?([0-9a-z\:]+)\]?)(?:\:([0-9]+))?$/);
  if (parts) {
    host = parts[1] === undefined ? parts[2] : parts[1];
    port = parts[3] === undefined ? port : parseInt(parts[3]);
  }
  else {
    throw new Error("Invalid host or port number");
  }
  
  this._host = host;
  this._port = port;
  this._readyCallback = readyCallback;
  this._lastConnectAttempt = 0;
  this.connect();
};

Transport.prototype.connect = function() {
  var self = this;
  
  if (new Date() - this._lastConnectAttempt < 5000) {
    return;
  }
  this._lastConnectAttempt = new Date();
  
  // Build options for net.connect().
  var options = {
    host: this._host,
    port: this._port,
    allowHalfOpen: true
  };
  
  // Open connection and add event listeners.
  this._socket = net.connect(options).on('connect', function() {
    // Disable Nagle.
    self._socket.setNoDelay(true);
    // Send startup frame.
    self._startup().then(function() {
      self.ready = true;
      if (self._readyCallback !== undefined) {
        self._readyCallback();
      }
    }).fail(function(error) {
      self.destroy();
      throw error;
    });
  }).on('close', function(had_error) {
    // Test this case with: tcpkill -i eth0 port 9042
    setTimeout(function() {
      self.connect();
    }, 5000);
  }).on('data', function(data) {
    self._inputBuffer = Buffer.concat([self._inputBuffer, new Buffer(data)]);
    self._fetchFrames();
  }).on('error', function(error) {
    if (error.code === 'ECONNRESET') {
      // Cassandra sometimes resets idle connections. We simple destroy this
      // transport. This will fail open queries (if any) and automatically
      // trigger the connection pool to open a new connection.
      self.destroy();
    }
    else {
      if (self._socket.destroyed) {
        self.connect();
      }
      throw error;
    }
  });
};

// Define constants.
Transport.ERROR = 0x00;
Transport.STARTUP = 0x01;
Transport.READY = 0x02;
Transport.AUTHENTICATE = 0x03;
Transport.CREDENTIALS = 0x04;
Transport.OPTIONS = 0x05;
Transport.SUPPORTED = 0x06;
Transport.QUERY = 0x07;
Transport.RESULT = 0x08;
Transport.PREPARE = 0x09;
Transport.EXECUTE = 0x0A;
Transport.REGISTER = 0x0B;
Transport.EVENT = 0x0C;

/**
 * Send the startup frame.
 */
Transport.prototype._startup = function() {
  // Create frame body, which is a string map with CQL version.
  var body = new Buffer('....CQL_VERSION..3.0.0');
  body.writeUInt16BE(1, 0);
  body.writeUInt16BE(11, 2);
  body.writeUInt16BE(5, 15);
  
  return this.sendFrame(Transport.STARTUP, body);
};

/**
 * Close connection.
 */
Transport.prototype.destroy = function() {
  var self = this;
  var reconnectInterval = this.ready ? 0 : 5000;
  this.ready = false;
  this._socket.end();
  Object.keys(this._promises).forEach(function(stream) {
    if (typeof self._promises[stream] === 'object') {
      self._promises[stream].reject('Connection closed');
    }
  });
  this._streamQueue.forEach(function(promise) {
    promise.reject('Connection closed');
  });
  setTimeout(function() {
    self.connect();
  }, reconnectInterval);
};

/**
 * Send a frame.
 * 
 * Returns a promise which will be resolved by _fetchFrame when we got a
 * response from the server.
 */
Transport.prototype.sendFrame = function(opcode, body) {
  var self = this;
  var defer = Q.defer();
  this._getStream().then(function(stream) {
    if (typeof opcode === 'undefined') {
      throw new Error('Missing opcode');
    }
    
    var frame = new Buffer(8 + body.length);
    
    // Write frame header.
    frame.writeInt8(0x01, 0); // Version
    frame.writeInt8(0x00, 1); // Flags
    frame.writeInt8(stream, 2);
    frame.writeInt8(opcode, 3);
    frame.writeUInt32BE(body.length, 4);
    
    new Buffer(body).copy(frame, 8);
    self._promises[stream] = defer;
    self._socket.write(frame);
  }).fail(function(error) {
    defer.reject(error);
  });
  return defer.promise;
};

/**
 * Fetch frames from the input buffer.
 * Do nothing if the input buffer doesn't contain enough data.
 */
Transport.prototype._fetchFrames = function() {
  // We need at least 8 bytes for the frame header.
  while (this._inputBuffer.length >= 8) {
    var length = 8 + this._inputBuffer.readUInt32BE(4);
    if (this._inputBuffer.length < length) {
      // This frame is incomplete. This function will be called again when
      // the remainding data comes in.
      return;
    }
    
    var frame = new Buffer(length);
    this._inputBuffer.copy(frame, 0, 0, length);
    
    // Shift off first frame and leave remaining data in input buffer.
    var remaining = new Buffer(this._inputBuffer.length - length);
    this._inputBuffer.copy(remaining, 0, length);
    this._inputBuffer = remaining;
    var stream = frame.readInt8(2);
    var opcode = frame.readUInt8(3);
    var body = new Buffer(length - 8);
    frame.copy(body, 0, 8);
    frame = undefined; // Free mem.
    if (typeof this._promises[stream] !== 'undefined') {
      if (opcode == Transport.ERROR) {
        this._promises[stream].reject(new TransportError(body));
      }
      else {
        this._promises[stream].resolve(body);
      }
      this._releaseStream(stream);
    }
    else {
      // @todo: Handle messages initiated by server
      console.log('unknown stream: ' + stream);
    }
  }
};

Transport.prototype._getStream = function() {
  var defer = new Q.defer();
  if (typeof this._promises[this._streamNumber] === 'undefined') {
    // The sendFrame-function will set this variable, but not directly.
    // Set it to null to indicate that this slot is reserved.
    this._promises[this._streamNumber] = null;
    defer.resolve(this._streamNumber);
  }
  else {
    this._streamQueue.push(defer);
  }
  // Maximum number of concurrent queries. Must be between 0x01 and 0x80.
  // It seems to run smoother at around 0x20 - 0x40 than 0x80. 
  var concurrency = 0x20;
  this._streamNumber = (this._streamNumber + 1) % concurrency;
  return defer.promise;
};

Transport.prototype._releaseStream = function(stream) {
  this._promises[stream] = undefined;
  var queued = this._streamQueue.shift();
  if (typeof queued !== 'undefined') {
    queued.resolve(stream);
  }
};


/**
 * TransportError class.
 */
var TransportError = function(frame) {
  var messageLength = frame.readUInt16BE(4);
  this.code = frame.readUInt32BE(0);
  this.message = frame.slice(6, 6 + messageLength).toString();
};

TransportError.prototype.toString = function() {
  return this.message;
};


module.exports = Transport;
