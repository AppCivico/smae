#!/bin/bash
rm -rf ./schema/
perl dump_schema.pl
perl render.pl
google-chrome schema.png