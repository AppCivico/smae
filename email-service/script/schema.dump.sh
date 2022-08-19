#!/usr/bin/env bash

if [ -d "script" ]; then
  cd script;
fi

dbicdump -o dump_directory=../lib \
             -o components='["InflateColumn::DateTime"]' \
             -o overwrite_modifications=1 \
             -o quote_names=1 \
             Shypper::Schema \
             'dbi:Pg:dbname=emaildb_dev' \
             postgres \
             mypassword

cd ..