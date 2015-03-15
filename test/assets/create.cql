
CREATE KEYSPACE castortest
WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE castortest;

CREATE TABLE user (
  user_id uuid,
  username varchar,
  password blob,
  PRIMARY KEY (user_id)
);

CREATE TABLE post (
  user_id uuid,
  post_id uuid,
  title varchar,
  PRIMARY KEY (user_id, post_id)
);


INSERT INTO user
(user_id, username, password)
VALUES
(4E67C89A-7C98-476D-A49A-957851CD3F5B, 'Alice', 0x0123456789);

INSERT INTO user
(user_id, username, password)
VALUES
(2C9E520D-28C0-4F5D-8FB4-5CE5F900CF0B, 'Bob', 0x0123456789);

INSERT INTO user
(user_id, username, password)
VALUES
(6E551631-E239-4442-9131-F4C93ABE0C6E, 'Chris', 0x0123456789);


INSERT INTO post
(user_id, post_id, title)
VALUES
(4E67C89A-7C98-476D-A49A-957851CD3F5B, 33ED0134-934F-42B8-8E4F-147AF4829C7C, 'First post');

INSERT INTO post
(user_id, post_id, title)
VALUES
(4E67C89A-7C98-476D-A49A-957851CD3F5B, C38021D3-A058-4B4B-B1B7-E7375DB0F898, 'Second post');


CREATE TABLE nullreference (
  id int,
  user_id uuid,
  PRIMARY KEY (id)
);

INSERT INTO nullreference (id, user_id) VALUES (1, NULL);


CREATE TABLE numbers (
  id int,
  value int,
  PRIMARY KEY (id)
); 

INSERT INTO numbers (id, value) VALUES (1, 8);
INSERT INTO numbers (id, value) VALUES (2, 5);
INSERT INTO numbers (id, value) VALUES (3, 3);
INSERT INTO numbers (id, value) VALUES (4, 1);
INSERT INTO numbers (id, value) VALUES (5, 9);


CREATE TABLE scalartypes (
  id int,
  test_ascii ascii,
  test_bigint bigint,
  test_blob blob,
  test_boolean boolean,
  test_decimal decimal,
  test_double double,
  test_float float,
  test_inet inet,
  test_int int,
  test_text text,
  test_timestamp timestamp,
  test_uuid uuid,
  test_timeuuid timeuuid,
  test_varchar varchar,
  test_varint varint,
  PRIMARY KEY (id)
);

INSERT INTO scalartypes (
  id,
  test_ascii,
  test_bigint,
  test_blob,
  test_boolean,
  test_decimal,
  test_double,
  test_float,
  test_inet,
  test_int,
  test_text,
  test_timestamp,
  test_uuid,
  test_timeuuid,
  test_varchar,
  test_varint
) VALUES (
  1,
  'ascii text',
  1234567890,
  0x1234567890ABCDEF,
  true,
  3.1415,
  3.1415,
  3.1415,
  '192.168.11.11',
  1234,
  'Lorem ipsum...',
  '2015-05-05T20:00:00',
  802b789c-6a22-4b1b-af59-a96a4653a086,
  430a80e0-cb0e-11e4-ab3c-ab16d2f74901,
  'varchar text',
  123456789012345678901234567890
);


CREATE TABLE counters (
  id int,
  counter1 counter,
  counter2 counter,
  PRIMARY KEY (id)
);


CREATE TABLE collections (
  id int,
  test_list list<varchar>,
  test_set set<varchar>,
  test_map map<varchar, int>,
  PRIMARY KEY (id)
);

INSERT INTO collections (id, test_list, test_set, test_map) VALUES (1, ['Alice', 'Bob'], {'Alice', 'Bob'}, {'Alice': 10, 'Bob': 20});
