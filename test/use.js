
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;
chai.should();

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Use', function() {
  it('returns a working client', function() {
    return db.use('castortest').get('user').execute().should.be.fulfilled;
  });
  
  it('gives an error on non-existing keyspaces', function() {
    return db.use('unknown').get('user').execute().should.be.rejected;
  });
  
  it('can read tables with derived schema', function() {
    return db.use('castortest2', true).get('user').execute().should.be.fulfilled;
  });
  
  it('cannot read tables with derived schema that do not exist in parent', function() {
    return db.use('castortest2', true).get('story').execute().should.be.rejected;
  });
  
  it('can read tables with non-derived schema that do not exist in parent', function() {
    return db.use('castortest2', false).get('story').execute().should.be.fulfilled;
  });
  
  it('does not derive the schema by default', function() {
    // We already validated the working of the second argument.
    return db.use('castortest2').get('story').execute().should.be.fulfilled;
  });
});
