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

describe('Get', function() {
  it('can retreive all data', function(done) {
    db.get('user').then(function(rows) {
      var data = rows.toArray();
      data.sort(function(a, b) {
        return a.username < b.username ? -1 : 1;
      });
      data.map(function(d) {
        d.password = d.password.toString('hex');
      })
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
    }).then(done).fail(throwIt).done();
  });

  it('retreives only specified columns', function(done) {
    db.get('user').fields(['user_id', 'username']).then(function(rows) {
      var data = rows.toArray();
      data.sort(function(a, b) {
        return a.username < b.username ? -1 : 1;
      });
      expect(data).to.deep.equal([
        {
          user_id: '4e67c89a-7c98-476d-a49a-957851cd3f5b',
          username: 'Alice',
        },
        {
          user_id: '2c9e520d-28c0-4f5d-8fb4-5ce5f900cf0b',
          username: 'Bob',
        },
        {
          user_id: '6e551631-e239-4442-9131-f4c93abe0c6e',
          username: 'Chris',
        }
      ]);
    }).then(done).fail(throwIt).done();
  });

  it('can be filtered', function(done) {
    db.get('user')
      .fields(['user_id', 'username'])
      .filter('user_id', '4e67c89a-7c98-476d-a49a-957851cd3f5b')
    .then(function(rows) {
      expect(rows.toArray()).to.deep.equal([
        {
          user_id: '4e67c89a-7c98-476d-a49a-957851cd3f5b',
          username: 'Alice',
        }
      ]);
    }).then(done).fail(throwIt).done();
  });
});
