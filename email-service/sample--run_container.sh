#!/bin/bash

# arquivo de exemplo para iniciar o container

export SOURCE_DIR='/path/to/this-source-code'
export DATA_DIR='/path/to/persistent/data'

# confira o seu ip usando ifconfig docker0|grep 'inet addr:'
export DOCKER_LAN_IP=172.17.0.1

mkdir -p $DATA_DIR/log
chown 1000:1000 $DATA_DIR/log

docker run --name NOME_SEU_CONTAINER \
	-v $SOURCE_DIR:/src -v $DATA_DIR:/data \
    -e "EMAILDB_DB_HOST=172.17.0.1" \
    -e "EMAILDB_DB_NAME=your_database" \
    -e "VARIABLES_JSON_IS_UTF8=1" \
	--cpu-shares=512 \
	--memory 500m -d --restart unless-stopped eokoe/emaildb
