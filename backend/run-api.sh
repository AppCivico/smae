#!/bin/bash
set -e

env
ls -lhas

npx prisma migrate deploy
node --enable-source-maps dist/prisma/seed.js

node --enable-source-maps dist/src/main
