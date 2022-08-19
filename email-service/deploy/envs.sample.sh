#!/bin/bash

# $ cp envs.sample.sh envs_local.sh
# setup envs_local.sh
# $ EMAILDB_ENV_FILE=deploy/envs_local.sh deploy/restart_services.sh
export GIT_DIR=$(git rev-parse --show-toplevel)

#export PERLBREW_ROOT=/opt/perlbrew
#source ${PERLBREW_ROOT}/etc/bashrc

# perlbrew guy?
source ~/perl5/perlbrew/etc/bashrc

# log directory
export EMAILDB_LOG_DIR=$HOME/http-callback-logs

# git location
export EMAILDB_APP_DIR=$GIT_DIR

# db

export EMAILDB_DB_HOST=localhost
export EMAILDB_DB_PASS=no
export EMAILDB_DB_PORT=5432
export EMAILDB_DB_USER=postgres
export EMAILDB_DB_NAME=emaildb_dev

export EMAILDB_SQITCH_DEPLOY_NAME=local
export EMAILDB_MAX_WORKERS=1
export EMAILDB_FETCH_ROWS=10