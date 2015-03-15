
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Signature', function() {
  it('can be generated for get queries', function() {
    var query = db.get('user');
    var signature = query.signature();
    expect(signature).to.be.a('string');
    
    // And validate that it is different when we change the query.
    query.fields(['user_id', 'password']);
    expect(query.signature()).to.not.equal(signature);
  });
});
