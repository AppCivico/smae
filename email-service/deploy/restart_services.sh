#!/bin/bash

[ -z "$EMAILDB_ENV_FILE" ] && echo "Need to set EMAILDB_ENV_FILE env before run this." && exit 1;

source $EMAILDB_ENV_FILE

mkdir -p $EMAILDB_LOG_DIR

line (){
    perl -e "print '-' x 40, $/";
}

cd $EMAILDB_APP_DIR;
cpanm -n --installdeps .;

cd $EMAILDB_APP_DIR;

sqitch deploy -t $EMAILDB_SQITCH_DEPLOY_NAME

line

echo "Restarting scripts...";

cd $EMAILDB_APP_DIR/script

# WOKRERS

./process-emails restart
line
echo "Sleeping... Check if is running";
sleep 1

./process-emails status
