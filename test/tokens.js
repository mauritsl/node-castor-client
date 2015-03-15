
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

var Q = require('q');

describe('Tokens', function() {
  it('can be used for iteration', function() {
    var users;
    return db.get('user')
      .fields(['user_id'])
    .then(function(rows) {
      users = rows.getColumn('user_id');
    }).then(function() {
      // Fetch all users one by one.
      var defer = Q.defer();
      var items = [];
      var next = function(token) {
        var query = db.get('user')
          .fields(['user_id'])
          .includeToken()
          .limit(1);
        if (typeof token !== 'undefined') {
          query.fromToken(token);
        }
        query.then(function(rows) {
          if (rows.valid()) {
            var user = rows.current();
            items.push(user.user_id);
            next(user.token);
          }
          else {
            defer.resolve(items);
          }
        }).done();
      };
      next();
      return defer.promise;
    }).then(function(items) {
      expect(items.sort()).to.deep.equal(users.sort());
    });
  });
});
