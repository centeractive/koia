@echo off
REM 1. Installs JSON and HTTP server programs if missing
REM 2. Starts JSON server and HTTP server programs and a browser window for Retrospective web-analysis
REM 
REM Prerequisite:
REM - download and install node.js (https://nodejs.org)

set DATA_DIR=%homepath%/.Retrospective/5.2.0/analysis
set HTTP_RAWDATA_PORT=3000
set HTTP_SUMDATA_PORT=3001
set WEBAPP_DIR="C:/workspaces.git/retrospective/retrospective-parent/web-analyzer/dist/retrospective"
set HTTP_SERVER_PORT=8080 

title Retrospective Analysis

echo checking environment...
if not exist npmList (
   npm list -g --depth=0 --silent > npmList|more
)
find " http-server@" npmList && find " json-server@" npmList
if %errorlevel%==1 (   
   echo installing missing components...
   npm install -g json-server|more
   npm install -g http-server|more
)

echo starting environment...
start /B json-server --port %HTTP_RAWDATA_PORT% --watch %DATA_DIR%/rawdata.json 
start /B json-server --port %HTTP_SUMDATA_PORT% --watch %DATA_DIR%/sumdata.json
start /B http-server %WEBAPP_DIR% -p %HTTP_SERVER_PORT%
start "" http://localhost:%HTTP_SERVER_PORT%