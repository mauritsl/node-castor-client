
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Uuid', function() {
  it('can be generated', function() {
    var uuid = db.uuid();
    expect(uuid).to.match(/^[0-9a-f]{8}\-[0-9a-f]{4}\-4[0-9a-f]{3}\-[0-9a-f]{4}\-[0-9a-f]{12}$/);
  });
});
