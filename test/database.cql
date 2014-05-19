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

