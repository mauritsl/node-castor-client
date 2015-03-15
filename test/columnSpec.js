
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.config.includeStack = true;
chai.use(chaiAsPromised);
var expect = chai.expect;

// Connect to Cassandra.
var Castor = require('../castor-client');
var db = new Castor('localhost', 'castortest');

describe('Column specifications', function() {
  it('can be retreived from rows', function() {
    return db.get('user').then(function(rows) {
      var columns = rows.getColumns();
      expect(columns).to.have.length(3);
      
      columns.forEach(function(column) {
        expect(column.getKeyspace()).to.equal('castortest');
        expect(column.getTablename()).to.equal('user');
        expect(['user_id', 'username', 'password']).to.contain(column.getName());
        
        expect(['user_id uuid', 'username varchar', 'password blob']).to.contain(column.toString());
        
        var type = column.getType();
        expect([type.UUID, type.VARCHAR, type.BLOB]).to.contain(type.getType());
        expect(['uuid', 'varchar', 'blob']).to.contain(type.getTypeName());
        expect(type.getValueType()).to.equal(undefined);
      });
      
    });
  });

  it('can be retreived for collections', function() {
    return db.get('collections')
      .fields(['test_list', 'test_set', 'test_map'])
      .filter('id', 1)
    .then(function(rows) {
      var columns = rows.getColumns();
      columns.forEach(function(column) {
        expect(column.getKeyspace()).to.equal('castortest');
        expect(column.getTablename()).to.equal('collections');
        expect(['test_list', 'test_set', 'test_map']).to.contain(column.getName());
        
        expect(['test_list list<varchar>', 'test_set set<varchar>', 'test_map map<varchar,int>']).to.contain(column.toString());
      });
      
    });
  });
});
