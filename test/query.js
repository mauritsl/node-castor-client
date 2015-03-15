
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;
chai.should();

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Query', function() {
  it('can be executed', function() {
    return db.query('SELECT * FROM castortest.user;').then(function(rows) {
      expect(rows.count()).to.equal(3);
    });
  });

  it('can switch keyspace', function() {
    return db.query('USE castortest;').then(function() {
      return db.query('SELECT * FROM user;').execute();
    }).then(function(rows) {
      expect(rows.count()).to.equal(3);
    });
  });

  it('rejects wrong queries', function() {
    db.query('SELECT *;').execute().should.be.rejeccted;
  });
});
