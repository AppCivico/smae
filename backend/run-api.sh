#!/bin/bash
set -e

env
ls -lhas

npx prisma migrate deploy
node dist/prisma/seed.js

node dist/src/main