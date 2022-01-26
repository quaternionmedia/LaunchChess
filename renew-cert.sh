#!/bin/bash
# This script creates (or renews) a domain [$1] through certbot, then
# copies the private key and certificate authority chain to a local file
DIR=$(pwd)
DOMAIN=launchchess.com
docker-compose down
cd ~/moat
docker-compose down
sudo certbot certonly --standalone -d $DOMAIN
docker-compose up -d

cd $DIR
sudo cat /etc/letsencrypt/live/$DOMAIN/privkey.pem > priv.pem
sudo cat /etc/letsencrypt/live/$DOMAIN/fullchain.pem >> priv.pem

docker-compose up -d
