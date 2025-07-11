#!/bin/bash

rsync --exclude ".git" -av $HOME/projetos/appcivico/middleware_smae_comunicados_transferegov/ $HOME/projetos/appcivico/smae/backend-transfere-gov/vendor/backend-transfere-gov/ --delete

rsync --exclude ".git" -av $HOME/projetos/appcivico/middleware_oportunidades_transferencias_especiais/ $HOME/projetos/appcivico/smae/backend-transfere-gov-especiais/vendor/backend-transfere-gov-especiais/ --delete
