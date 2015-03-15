
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Join', function() {
  it('can retreive data', function() {
    return db.get('user')
      .fields(['user_id', 'username'])
      .join('user_id', 'post.user_id', ['title'])
    .then(function(rows) {
      // A join does not multiply the number of rows like SQL does.
      // Neither does it filter rows with no match on the join.
      // There are 3 users, so the result must always contain 3 rows.
      expect(rows.count()).to.equal(3);
      
      rows.toArray().forEach(function(row) {
        if (row.username == 'Alice') {
          // Alice does have two posts. Expect this row to contain one of these posts.
          expect(['First post', 'Second post']).to.contain(row.title);
        }
        else {
          // Bob and Chris do not have posts.
          expect(row.title).to.equal(null);
        }
      });
    });
  });
  
  it.skip('can handle NULL values in left field', function() {
    return db.get('nullreference')
      .fields(['user_id'])
      .join('user_id', 'user.user_id', ['username'])
    .then(function(rows) {
      expect(rows.count()).to.equal(1);
      rows.toArray().forEach(function(row) {
        expect(row.username).to.equal(null);
      });
    });
  });
});
