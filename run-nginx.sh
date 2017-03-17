#!/bin/bash
# Starts an nginx docker container to statically serve up the project
# Note: make sure you've run the npm-install.sh script so the 3rd party libs are present
cd `dirname $0`
CURR_DIR=`pwd`
EXTERNAL_PORT=8080
echo "Starting in foreground with port $EXTERNAL_PORT exposed. Container will die on exit"
docker run --name rf-nginx -v $CURR_DIR:/usr/share/nginx/html:ro --rm -p $EXTERNAL_PORT:80 nginx
