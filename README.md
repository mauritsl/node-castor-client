node-castor-client
==================

Cassandra client library for NodeJS, using the native binary protocol.

Key features:

- Using Cassandra's binary protocol
- Object oriented data access
- Automatic input encoding
- Connection pooling
- Using promises
- Native support for all Cassandra datatypes

Data structure is read automatically, so Castor knows how to encode the input.
This improves the security as well, since you are well protected against
injection attacks when you stick with the ``get``, ``set`` and ``del`` methods,
rather than sending raw queries using the ``query`` method.

## Installation

Install using ``npm install castor-client``

## Connecting

```javascript
var Castor = require('../castor/castor-client');
var db = new Castor('localhost', 'keyspace');
```

## Retreiving data

Data is retreived using the ``get`` function. You can call this function 
directly after connecting to the database. There is no need to wait for an
event, as queries are automatically stacked and executed when the connection is
ready.

Every call to ``get`` requires that you specify a tablename as parameter. The
list of fields which you want to retreive can be specified using the ``fields``
function. All fields will be returned if not specified. The query is executed
when you call the ``then`` function or when using the ``execute`` function to
get the raw promise. You can use the ``filter`` function multiple times.

Iterating on the resultset can be done in two ways. You can iterate using the
``valid``, ``current`` and ``next`` functions or you can use the ``toArray``
function to get the whole resultset as an array.

```javascript
db.get('user')
  .fields(['user_id', 'birthdate'])
  .filter('username', 'John Doe')
  .orderBy('username', 'asc')
  .limit(10)
  .allowFiltering(true)
.then(function(rows) {
  // Basic iteration.
  while (rows.valid()) {
    var row = rows.current();
    console.log(row.user_id);
    rows.next();
  }
  // Before we can loop again, we must call the rewind() function.
  rows.rewind();
  
  // Using the toArray() function.
  rows.toArray().forEach(function(row)) {
    console.log(row.user_id);
  }
  
  // Get the 'username' column as an array.
  var usernames = rows.getColumn('username');
  
  // Get the row count.
  var rowCount = rows.count();
}).fail(function(error) {
  console.log(error);
});
```

## Updating and inserting data

There is no real difference between ``UPDATE`` and ``INSERT`` queries in
Cassandra. It is possible to insert data using an ``UPDATE`` query. But the
update query does not allow us to insert rows with only the primary key and the
insert query does not allow us to use increments / decrements. In Castor, you
always use the ``set`` function for both cases.

```javascript
db.set('user')
  .field('firstname', 'John')
  .field('lastname', 'Doe')
.then(function() {
  console.log('updated');
}).fail(function(error) {
  console.log(error);
});
```

Counter columns can be updated using the ``incr`` and ``decr`` functions.

```javascript
db.set('user_logins')
  .field('user_id', user_id)
  .incr('logins')
  .execute();
```

## Deleting data

Deleting data can be done using the ``del`` method.

```javascript
db.del('user')
  .filter('user_id', user_id)
.then(function() {
  console.log('deleted');
}).fail(function(error) {
  console.log(error);
});
```

In Cassandra, it is also possible to delete just a few fields from the row.

```javascript
db.del('user')
  .fields(['firstname', 'lastname'])
  .filter('user_id', user_id)
  .execute();
```

## Consistency

The desired consistency can be provided using the ``consistency`` function.
This function is available on ``get``, ``set``, ``del`` and ``query``.

```javascript
db.get('user')
  .consistency(db.CONSISTENCY_ONE)
.then(function(rows) {
  console.log(rows.toArray());
});
```

The following options are available:

- ``CONSISTENCY_ANY`` (not applicable on ``get``)
- ``CONSISTENCY_ONE``
- ``CONSISTENCY_TWO``
- ``CONSISTENCY_THREE``
- ``CONSISTENCY_QUORUM``
- ``CONSISTENCY_ALL``
- ``CONSISTENCY_LOCAL_QUORUM``
- ``CONSISTENCY_EACH_QUORUM``
- ``CONSISTENCY_LOCAL_ONE``

## Joins

The ``join`` function allows you to easily include values derived from another
table through a foreign key. Be aware that Cassandra does not support joins.
This function does actually do another query for each row. This function should
be used with great care, as it might have detrimental effects on performance
when used on large resultsets.

```javascript
db.get('user')
  .fields(['user_id', 'username'])
  .join('user_id', 'post.user_id', ['title'])
.then(function(rows) {
  while (rows.valid()) {
    var row = rows.current();
    console.log(row.username + ' has post ' + row.title);
    rows.next();
  }
});    
```

Joins do not multiply the number of rows like SQL does. For each row and field,
the join can provide at most one value. When no matching row in the right table
can be found, a null is provided. So if a user in the example above has multiple
posts in the table ``post``, the column ``title`` will only contain the first
post title returned from the database.

## Promises

Query results can be retreived as promises using the ``execute`` function.
These promises can be consumed by other promise libraries like "Q".
By using ``execute``, you can return the promise to include the query in a chain
of 'thenables'.

```javascript
Q.when(true).then(function() {
  return db.get('user').execute();
}).then(function(users) {
  doSomethingWith(users);
  return db.get('posts').execute();
}).then(function(posts) {
  doSomethingWith(posts);
}).fail(function(error) {
  console.log(error);
});
```

The advantage of this workflow is that you can specify an error handler (the
``fail`` function) once for all queries in the chain.

When not using chains, you can directly call ``then`` after ``execute``.

```javascript
db.get('users').execute().then(function(rows) { });
```

As shown in many examples above, the ``then`` function is also directly
available on the query specification. The ``then`` function automatically calls
the ``execute`` function and delegates the call to the ``then`` function of the
promise. That means that the example above is the same as:

```javascript
db.get('users').then(function(rows) { });
```

This can only be done when using ``then``. You cannot call ``fail`` in this way.
You still have to use ``execute`` when you want to use ``fail`` without using
``then``.

```javascript
db.get('users').execute().fail(function(error) { });
```

## Column specifications

You can get a specification of the columns in the resultset using the
``getColumns`` function. All available functions can be found in the following
example.

```javascript
db.get('users').then(function(rows) {
  rows.getColumns().forEach(function(column) {
    column.getKeyspace();
    column.getTablename();
    column.getName();
    
    // Get specification as string (e.g. "user_id <uuid>").
    column.toString();
    
    // Get type specification.
    var type = column.getType();
    type.getType();
    type.getTypeName();
    
    // Valuetype for keys used in maps.
    type.getKeyType().getTypeName();
    
    // Valuetype for values used in lists, sets and maps.
    type.getValueType().getTypeName();
    
    if (type.getType() == type.VARCHAR) {
      // ...
    }
  });
});
```

The ``getType`` function on the type specification returns an integer. This can
be compared to one of the following constants:

- ``CUSTOM``
- ``ASCII``
- ``BIGINT``
- ``BLOB``
- ``BOOLEAN``
- ``COUNTER``
- ``DECIMAL``
- ``DOUBLE``
- ``FLOAT``
- ``INT``
- ``TEXT``
- ``TIMESTAMP``
- ``UUID``
- ``VARCHAR``
- ``VARINT``
- ``TIMEUUID``
- ``INET``
- ``COLLECTION_LIST``
- ``COLLECTION_MAP``
- ``COLLECTION_SET``

## Executing raw queries

Instead of using ``get``, ``set`` and ``del``, you may also use ``query`` to
execute raw queries. This is not the recommended way to use Castor, since there
is no sanitizing available for user input.

```javascript
db.query('SELECT * FROM user').then(function(rows) {
  console.log(rows.toArray());
});
```
