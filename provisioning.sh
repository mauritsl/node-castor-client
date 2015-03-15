#!/bin/sh

export DEBIAN_FRONTEND=noninteractive

apt-get update

# Java 8
(cd /usr/lib/ && tar -xzf /data/jre-8u25-linux-x64.tar.gz) 
update-alternatives --install "/usr/bin/java" "java" "/usr/lib/jre1.8.0_25/bin/java" 1 && update-alternatives --config java

# Cassandra
curl -L http://debian.datastax.com/debian/repo_key | sudo apt-key add -
echo "deb http://debian.datastax.com/community/ stable main" >> /etc/apt/sources.list.d/datastax.list
apt-get update
apt-get install -y cassandra  
sed -i 's/listen_address: localhost/listen_address: 192.168.11.11/g' /etc/cassandra/cassandra.yaml
sed -i 's/rpc_address: localhost/rpc_address: 0.0.0.0/g' /etc/cassandra/cassandra.yaml
sed -i 's/seeds: "127.0.0.1"/seeds: "192.168.11.11"/g' /etc/cassandra/cassandra.yaml
sed -i 's/# broadcast_rpc_address: 1.2.3.4/broadcast_rpc_address: 192.168.11.11/g' /etc/cassandra/cassandra.yaml
service cassandra restart

# NodeJS
apt-get install -y npm nodejs nodejs-legacy
(cd /data && npm install)
