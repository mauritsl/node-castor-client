var chai = require('chai');
var config = require('./config');
var Castor = require('../castor-client');

// Chai configuration.
chai.config.includeStack = true;
var expect = chai.expect;

// Connect to Cassandra.
var db = new Castor(config.host, config.keyspace);

// Helper function to throw errors.
var throwIt = function(e) { throw e; };

describe('Uuid', function() {
  it('can be generated', function() {
    var uuid = db.uuid();
    expect(uuid).to.match(/^[0-9a-f]{8}\-[0-9a-f]{4}\-4[0-9a-f]{3}\-[0-9a-f]{4}\-[0-9a-f]{12}$/);
  });
});
