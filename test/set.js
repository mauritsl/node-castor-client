
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
});
