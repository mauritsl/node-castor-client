
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Set', function() {
  it('can set data', function() {
    return db.set('scalartypes')
      .field('id', 99)
      .field('test_varchar', 'test')
    .then(function() {
      return db.get('scalartypes')
        .fields(['id', 'test_varchar'])
        .filter('id', 99)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      expect(rows.current().test_varchar).to.equal('test');
    });
  });

  it('can set data with primary key only', function() {
    return db.set('scalartypes')
      .field('id', 99)
      .execute();
  });
  
  it('can set fields to null', function() {
    return db.set('scalartypes')
      .field('id', 90)
      .field('test_int', 123)
      .field('test_varchar', null)
    .then(function() {
      return db.get('scalartypes')
        .fields(['id', 'test_int', 'test_varchar'])
        .filter('id', 90)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      expect(rows.current().test_int).to.equal(123);
      expect(rows.current().test_varchar).to.equal(null);
    }).then(function() {
      return db.set('scalartypes')
        .field('id', 90)
        // Set varchar back to "test" to prevent the whole row from being removed. 
        .field('test_varchar', 'test')
        .field('test_int', null)
        .execute();
    }).then(function() {
      return db.get('scalartypes')
        .fields(['id', 'test_int', 'test_varchar'])
        .filter('id', 90)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      expect(rows.current().test_int).to.equal(null);
      expect(rows.current().test_varchar).to.equal('test');
    });
  });
});
