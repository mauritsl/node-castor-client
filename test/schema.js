
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Schema', function() {
  it('can be retreived', function() {
    return db.schema().then(function(schema) {
      expect(schema).to.be.an('object');
      expect(schema).to.have.property('user');
      expect(schema.user.keys).to.deep.equal(['user_id']);
      expect(schema.user.values.sort()).to.deep.equal(['username', 'password'].sort());
    });
  });

  it('can be retreived for a single table', function() {
    return db.schema('user').then(function(schema) {
      expect(schema).to.be.an('object');
      expect(schema).to.have.property('keys');
      expect(schema.keys).to.deep.equal(['user_id']);
      expect(schema.values.sort()).to.deep.equal(['username', 'password'].sort());
    });
  });
  
  it('can be reloaded', function() {
    return db.schema().then(function(schema) {
      expect(schema).to.not.have.property('newtable');
    }).then(function() {
      return db.query('CREATE TABLE castortest.newTable (id int, PRIMARY KEY (id));');
    }).then(function() {
      return db.schema();
    }).then(function(schema) {
      expect(schema).to.not.have.property('newtable');
    }).then(function() {
      return db.reloadSchema();
    }).then(function() {
      return db.schema();
    }).then(function(schema) {
      expect(schema).to.have.property('newtable');
    });
  });
});
