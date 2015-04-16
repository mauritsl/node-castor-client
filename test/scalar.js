
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;
chai.should();

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

var moment = require('moment');

describe('Scalar data types', function() {
  it('can be read', function() {
    return db.get('scalartypes')
      .filter('id', 1)
    .then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(row.test_ascii).to.equal('ascii text');
      expect(row.test_bigint).to.equal('1234567890');
      expect(row.test_blob.toString('hex')).to.equal('1234567890abcdef');
      expect(row.test_boolean).to.equal(true);
      expect(row.test_decimal).to.equal('3.1415');
      // Floats and doubles can have values like 3.141499999999. Compare rounded values.
      expect((row.test_double).toFixed(4)).to.equal('3.1415');
      expect((row.test_float).toFixed(4)).to.equal('3.1415');
      expect(row.test_inet).to.equal('192.168.11.11');
      expect(row.test_int).to.equal(1234);
      expect(row.test_text).to.equal('Lorem ipsum...');
      expect(String(row.test_timestamp).substring(0, 19)).to.equal('2015-05-05T20:00:00');
      expect(row.test_uuid).to.equal('802b789c-6a22-4b1b-af59-a96a4653a086');
      expect(row.test_timeuuid).to.equal('430a80e0-cb0e-11e4-ab3c-ab16d2f74901');
      expect(row.test_varchar).to.equal('varchar text');
      expect(row.test_varint).to.equal('123456789012345678901234567890');
    });
  });
  
  it('can be set', function() {
    return db.set('scalartypes')
      .field('id', 2)
      .field('test_ascii', 'To be or not to be, that is the question;')
      .field('test_bigint', 9876543210)
      .field('test_blob', new Buffer('test'))
      .field('test_boolean', false)
      .field('test_decimal', 2.7182818)
      .field('test_double', 3.1415)
      .field('test_float', 3.1415)
      .field('test_inet', '127.0.0.1')
      .field('test_int', 1000000)
      .field('test_text', 'Whether \'tis nobler in the mind to suffer')
      .field('test_timestamp', '2002-03-24T12:34:56')
      .field('test_uuid', '802b789c-6a22-4b1b-af59-a96a4653a086')
      .field('test_timeuuid', '430a80e0-cb0e-11e4-ab3c-ab16d2f74901')
      .field('test_varchar', 'The slings and arrows of outrageous fortune,')
      .field('test_varint', '7182818284590452353602874')
    .then(function() {
      return db.get('scalartypes')
        .filter('id', 2)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(row.test_ascii).to.equal('To be or not to be, that is the question;');
      expect(row.test_bigint).to.equal('9876543210');
      expect(row.test_blob.toString()).to.equal('test');
      expect(row.test_boolean).to.equal(false);
      expect(row.test_decimal).to.equal('2.7182818');
      // Floats and doubles can have values like 3.141499999999. Compare rounded values.
      expect((row.test_double).toFixed(4)).to.equal('3.1415');
      expect((row.test_float).toFixed(4)).to.equal('3.1415');
      expect(row.test_inet).to.equal('127.0.0.1');
      expect(row.test_int).to.equal(1000000);
      expect(row.test_text).to.equal('Whether \'tis nobler in the mind to suffer');
      expect(String(row.test_timestamp).substring(0, 19)).to.equal('2002-03-24T12:34:56');
      expect(row.test_uuid).to.equal('802b789c-6a22-4b1b-af59-a96a4653a086');
      expect(row.test_timeuuid).to.equal('430a80e0-cb0e-11e4-ab3c-ab16d2f74901');
      expect(row.test_varchar).to.equal('The slings and arrows of outrageous fortune,');
      expect(row.test_varint).to.equal('7182818284590452353602874');
    });
  });
  
  it('cannot accept strings for numeric values', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_int', 'three')
      .execute().should.be.rejected;
  });
  
  it('cannot accept numbers for blobs', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_blob', 123)
      .execute().should.be.rejected;
  });
  
  it('cannot accept numbers for booleans', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_boolean', 1)
      .execute().should.be.rejected;
  });
  
  it('cannot accept textual values for doubles', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_double', 'two and a half')
      .execute().should.be.rejected;
  });
  
  it('cannot accept invalid dates for timestamp', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_timestamp', 'half past nine')
      .execute().should.be.rejected;
  });
  
  it('cannot accept numbers for timestamp', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_timestamp', 123)
      .execute().should.be.rejected;
  });
  
  it('cannot accept numbers for uuid', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_uuid', 123)
      .execute().should.be.rejected;
  });
  
  it('cannot accept invalid uuids for uuid', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_uuid', 'test')
      .execute().should.be.rejected;
  });
  
  it('can handle dates', function() {
    var date = new Date();
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_timestamp', date)
    .then(function() {
      return db.get('scalartypes')
        .filter('id', 3)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(String(row.test_timestamp).substring(0, 10)).to.equal(moment().format('YYYY-MM-DD'));
    });
  });
  
  it('saves 0000-00-00 as NULL', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_varchar', 'test')
      .field('test_timestamp', '0000-00-00T00:00:00')
    .then(function() {
      return db.get('scalartypes')
        .filter('id', 3)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(row.test_timestamp).to.equal(null);
    });
  });
  
  it('can handle dates before epoch', function() {
    var date = '1860-02-23T12:34:56';
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_timestamp', date)
    .then(function() {
      return db.get('scalartypes')
        .filter('id', 3)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(String(row.test_timestamp).substring(0, date.length)).to.equal(date);
    });
  });
  
  it('can handle ipv6 addresses', function() {
    return db.set('scalartypes')
      .field('id', 3)
      .field('test_inet', '2001:db8::ff00:42:8329')
    .then(function() {
      return db.get('scalartypes')
        .filter('id', 3)
        .execute();
    }).then(function(rows) {
      if (!rows.valid()) {
        throw Error('Row not found');
      }
      return rows.current();
    }).then(function(row) {
      expect(row.test_inet).to.equal('2001:db8::ff00:42:8329');
    });
  });
});
