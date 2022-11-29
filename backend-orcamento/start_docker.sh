#! /bin/bash

set -e

#stop container
docker kill middleware_sof | true
# stop the container
docker rm middleware_sof | true

#pull new commits - nao entendi porque ficaria nesse script
# git pull

. build-container.sh

if [ -f ".env" ]; then
    echo "loading .env"
    source .env
else
    echo ".env does not exist. please update it!"
    exit;
fi

PORT=${PORT:-80}

#run container with restart
docker run -d --name middleware_sof -e SOF_API_TOKEN="$SOF_API_TOKEN" --restart unless-stopped -p $PORT:80 middleware_sof
