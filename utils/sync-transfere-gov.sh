#!/bin/bash

rsync --exclude ".git" -av $HOME/projetos/appcivico/middleware_smae_comunicados_transferegov/ $HOME/projetos/appcivico/smae/backend-transfere-gov/ --delete
