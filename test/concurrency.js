
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;
chai.should();

var Q = require('q');

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

var test = function(count) {
  return function() {
    this.timeout(30000);
    var queries = [];
    for (var i = 0; i < count; ++i) {
      var query = db.get('user').execute();
      queries.push(query);
    }
    return Q.all(queries).then(function(results) {
      for (var i = 0; i < count; ++i) {
        var data = results[i].toArray();
        data.sort(function(a, b) {
          return a.username < b.username ? -1 : 1;
        });
        data.map(function(d) {
          d.password = d.password.toString('hex');
        });
        expect(data).to.deep.equal([
          {
            user_id: '4e67c89a-7c98-476d-a49a-957851cd3f5b',
            username: 'Alice',
            password: '0123456789'
          },
          {
            user_id: '2c9e520d-28c0-4f5d-8fb4-5ce5f900cf0b',
            username: 'Bob',
            password: '0123456789'
          },
          {
            user_id: '6e551631-e239-4442-9131-f4c93abe0c6e',
            username: 'Chris',
            password: '0123456789'
          }
        ]);
      }
    });
  };
};

describe('Concurrency', function() {
  // The performance stalls from about 120 concurrent queries in the test setup.
  // Still unsure why, but it works good from a functional perspective.
  // The queueing of streams is tested in this test case, since 50 is above
  // the current maximum number of queries that we will send concurrently.
  // @see Transport.prototype._getStream()
  for (var count = 5; count <= 50; count += 5) {
    it('can handle ' + count + ' simulteaneous GET-queries', test(count));
  }
});
