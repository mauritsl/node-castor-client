
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Del', function() {
  it('can delete data', function() {
    var user_id = db.uuid();
    return db.set('user')
      .field('user_id', user_id)
      .field('username', 'test')
    .then(function() {
      return db.get('user')
        .filter('user_id', user_id)
        .execute();
    }).then(function(rows) {
      expect(rows.valid()).to.equal(true);
    }).then(function() {
      return db.del('user')
        .filter('user_id', user_id)
        .execute();
    }).then(function() {
      return db.get('user')
        .filter('user_id', user_id)
        .execute();
    }).then(function(rows) {
      expect(rows.valid()).to.equal(false);
    });
  });

  it('can delete fields', function() {
    var user_id = db.uuid();
    return db.set('user')
      .field('user_id', user_id)
      .field('password', new Buffer('test'))
      .field('username', 'test')
    .then(function() {
      return db.get('user')
        .filter('user_id', user_id)
        .execute();
    }).then(function(rows) {
      expect(rows.valid()).to.equal(true);
      expect(rows.current().username).to.equal('test');
    }).then(function() {
      return db.del('user')
        .fields(['username'])
        .filter('user_id', user_id)
        .execute();
    }).then(function() {
      return db.get('user')
        .filter('user_id', user_id)
        .execute();
    }).then(function(rows) {
      expect(rows.valid()).to.equal(true, 'row may not be entirely removed');
      expect(rows.current().username).to.equal(null, 'username field must be empty');
    }).then(function() {
      return db.del('user')
        .filter('user_id', user_id)
        .execute();
    });
  });
});
