#!/bin/sh
mkdir -p /data/log
chown app:app /data/log -R
exec /sbin/setuser app /src/start-server.sh
