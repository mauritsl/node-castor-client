var chai = require('chai');
var config = require('./config');
var Castor = require('../castor-client');

// Chai configuration.
chai.config.includeStack = true;
var expect = chai.expect;

// Connect to Cassandra.
var db = new Castor(config.host, config.keyspace);

// Helper function to throw errors.
var throwIt = function(e) { throw e; };

describe('Join', function() {
  it('can retreive data', function(done) {
    db.get('user')
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
    }).then(done).fail(throwIt).done();
  });
});
