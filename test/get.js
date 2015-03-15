
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;
chai.should();

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Get', function() {
  it('can retreive all data', function() {
    return db.get('user').then(function(rows) {
      var data = rows.toArray();
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
    });
  });

  it('retreives only specified columns', function() {
    return db.get('user').fields(['user_id', 'username']).then(function(rows) {
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
    });
  });

  it('can be filtered', function() {
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
    });
  });
  
  it('can be read using current / next loop', function() {
    return db.get('user').then(function(rows) {
      var count = 0;
      while (rows.valid()) {
        expect(rows.key()).to.equal(count);
        ++count;
        row = rows.current();
        expect(row).to.be.an('object');
        expect(row).to.have.property('user_id');
        expect(row).to.have.property('username');
        rows.next();
      }
      expect(count).to.equal(3);
      
      // And check that we can loop again after rewind.
      rows.rewind();
      count = 0;
      while (rows.valid()) {
        ++count;
        row = rows.current();
        rows.next();
      }
      expect(count).to.equal(3);
    });
  });
  
  it('cannot provide more rows than the resultset contains', function() {
    return db.get('user').then(function(rows) {
      while (rows.valid()) {
        rows.next();
      }
      expect(function() {
        rows.current();
      }).to.throw(Error);
    });
  });
  
  it('can provide column arrays', function() {
    return db.get('user').fields(['username']).then(function(rows) {
      var data = rows.getColumn('username');
      expect(data.sort()).to.deep.equal(['Alice', 'Bob', 'Chris']);
    });
  });
  
  it('can provide the row count', function() {
    return db.get('user').fields(['username']).then(function(rows) {
      var count = rows.count();
      expect(rows.toArray().length).to.equal(count);
    });
  });
  
  it('can order the results', function() {
    // Note that ordering in Cassandra is only supported when used on the
    // second primary key field while filtering the first.
    return db.get('post')
      .filter('user_id', '4E67C89A-7C98-476D-A49A-957851CD3F5B')
      .orderBy('post_id')
    .then(function(rows) {
      expect(rows.getColumn('post_id')).to.deep.equal(rows.getColumn('post_id').sort());
    });
  });
  
  it('can order the results in descending order', function() {
    return db.get('post')
      .filter('user_id', '4E67C89A-7C98-476D-A49A-957851CD3F5B')
      .orderBy('post_id', 'desc')
    .then(function(rows) {
      expect(rows.getColumn('post_id')).to.deep.equal(rows.getColumn('post_id').sort().reverse());
    });
  });
  
  it('can allow filtering', function() {
    // Cassandra does not seem to accept filtering, even with ALLOW FILTERING added.
    // Is this a setting that needs to b e enabled?
    return db.get('post')
      .filter('user_id', '4E67C89A-7C98-476D-A49A-957851CD3F5B')
      .allowFiltering()
    .then(function(rows) {
      expect(rows.count()).to.equal(2);
    });
  });
  
  it('cannot use arbitrary operators', function() {
    expect(function() {
      db.get('numbers')
        .filter('id', 3, '~')
        .execute();
    }).to.throw(Error);
  });
  
  it('cannot filter on non-existing fields', function() {
    db.get('numbers')
      .filter('test', 3)
      .execute().should.be.rejected;
  });
  
  it('cannot read non-existing tables', function() {
    db.get('unknown_table')
      .execute().should.be.rejected;
  });
});
