#!/bin/bash
# Runs a docker container to do `npm install` on this project
cd `dirname $0`
CURR_DIR=`pwd`
docker run \
  --name reporting-npm-install \
  -v $CURR_DIR:/app \
  --rm \
  --user `id -u` \
  digitallyseamless/nodejs-bower-grunt:latest \
  /bin/bash -c "cd /app; npm install --unsafe-perm"
