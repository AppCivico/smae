#!/bin/bash

[ -z "$EMAILDB_ENV_FILE" ] && echo "Need to set EMAILDB_ENV_FILE env before run this." && exit 1;

source $EMAILDB_ENV_FILE

cd $EMAILDB_APP_DIR/script
# WOKRERS
./process-emails start
