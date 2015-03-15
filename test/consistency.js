
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Consistency', function() {
  it('is accepted for get', function() {
    return db.get('user')
      .consistency(db.CONSISTENCY_ONE)
      .execute();
  });
  
  it('is accepted for set', function() {
    return db.set('scalartypes')
      .field('id', 99)
      .field('test_varchar', 'test')
      .consistency(db.CONSISTENCY_ONE)
      .execute();
  });
  
  it('is accepted for del', function() {
    return db.del('scalartypes')
      .filter('id', 99)
      .consistency(db.CONSISTENCY_ONE)
      .execute();
  });
  
  it('is accepted for query', function() {
    return db.query('CREATE TABLE castortest.testtable (id int, name varchar, PRIMARY KEY (id));')
      .consistency(db.CONSISTENCY_ONE)
      .execute();
  });
});
