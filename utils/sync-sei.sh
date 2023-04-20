#!/bin/bash

rsync -av $HOME/projetos/appcivico/middleware_smae_sei/* $HOME/projetos/appcivico/smae/backend-sei/
rsync -av $HOME/projetos/appcivico/middleware_smae_sei/.gitignore $HOME/projetos/appcivico/smae/backend-sei/
rsync -av $HOME/projetos/appcivico/middleware_smae_sei/.env.* $HOME/projetos/appcivico/smae/backend-sei/

