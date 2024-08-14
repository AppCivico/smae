#!/bin/bash

rsync --exclude ".git" -av $HOME/projetos/appcivico/middleware_smae_sei/ $HOME/projetos/appcivico/smae/backend-sei/ --delete
