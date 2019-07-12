#!/bin/bash
# 1. Installs JSON and HTTP server programs if missing
# 2. Starts JSON server and HTTP server programs and a browser window for Retrospective web-analysis
# 
# Prerequisite:
# - download and install node.js (https://nodejs.org)

DATA_DIR=~/.Retrospective/5.2.0/analysis
HTTP_RAWDATA_PORT=3000
HTTP_SUMDATA_PORT=3001
WEBAPP_DIR="/c/workspaces.git/retrospective/retrospective-parent/web-analyzer/dist/retrospective"
HTTP_SERVER_PORT=8080

echo checking environment...
if [ ! -f npmList ]; then
   npm list -g --depth=0 --silent > npmList
fi
if ! grep -q " http-server@" npmList || ! grep -q " json-server@" npmList; then   
   echo install json-server and http-server...
   npm install -g json-server
   npm install -g http-server
fi

echo starting environment...
json-server --port $HTTP_RAWDATA_PORT --watch $DATA_DIR/rawdata.json &
json-server --port $HTTP_SUMDATA_PORT --watch $DATA_DIR/sumdata.json &
http-server $WEBAPP_DIR -p $HTTP_SERVER_PORT &
start http://localhost:$HTTP_SERVER_PORT