
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Counters', function() {
  it('can be increased', function() {
    return db.set('counters')
      .field('id', 1)
      .incr('counter1', 1)
      .incr('counter2', 5)
    .then(function() {
      return db.get('counters')
        .filter('id', 1)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(row.counter1).to.equal('1');
      expect(row.counter2).to.equal('5');
    }).then(function() {
      return db.set('counters')
      .field('id', 1)
      .incr('counter1', 1)
      .incr('counter2', 5)
      .execute();
    }).then(function() {
      return db.get('counters')
        .filter('id', 1)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(row.counter1).to.equal('2');
      expect(row.counter2).to.equal('10');
    }).then(function() {
      return db.set('counters')
      .field('id', 1)
      .decr('counter1', 4)
      .decr('counter2', 5)
      .execute();
    }).then(function() {
      return db.get('counters')
        .filter('id', 1)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(row.counter1).to.equal('-2');
      expect(row.counter2).to.equal('5');
    });
  });
});
