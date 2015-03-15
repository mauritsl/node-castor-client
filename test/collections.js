
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;
chai.should();

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Collections', function() {
  it('can be read', function() {
    return db.get('collections')
      .filter('id', 1)
    .then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(row.test_list).to.deep.equal(['Alice', 'Bob']);
      expect(row.test_set.sort()).to.deep.equal(['Alice', 'Bob']);
      expect(row.test_map).to.deep.equal({Alice: 10, Bob: 20});
    });
  });
  
  it('can be set', function() {
    return db.set('collections')
      .field('id', 2)
      .field('test_list', ['Alice', 'Bob', 'Chris'])
      .field('test_set', ['Alice', 'Bob', 'Chris'])
      .field('test_map', {first: 1, second: 2})
    .then(function() {
      return db.get('collections')
        .filter('id', 2)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(row.test_list).to.deep.equal(['Alice', 'Bob', 'Chris']);
      expect(row.test_set.sort()).to.deep.equal(['Alice', 'Bob', 'Chris']);
      expect(row.test_map).to.deep.equal({first: 1, second: 2});
    });
  });
  
  it('cannot accept strings for list', function() {
    db.set('scalartypes')
      .field('id', 3)
      .field('test_list', 'test')
      .execute().should.be.rejected;
  });
  
  it('cannot accept arrays for maps', function() {
    db.set('scalartypes')
      .field('id', 3)
      .field('test_map', ['first', 'second'])
      .execute().should.be.rejected;
  });
  
  it('cannot accept strings for maps', function() {
    db.set('scalartypes')
      .field('id', 3)
      .field('test_list', 'test')
      .execute().should.be.rejected;
  });
  
  it('cannot accept strings for set', function() {
    db.set('scalartypes')
      .field('id', 3)
      .field('test_set', 'test')
      .execute().should.be.rejected;
  });
});
