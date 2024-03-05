#!/bin/bash

rsync -av $HOME/projetos/appcivico/middleware_orcamento_smae/* $HOME/projetos/appcivico/smae/backend-orcamento/
rsync -av $HOME/projetos/appcivico/middleware_orcamento_smae/.gitignore $HOME/projetos/appcivico/smae/backend-orcamento/
rsync -av $HOME/projetos/appcivico/middleware_orcamento_smae/.env.* $HOME/projetos/appcivico/smae/backend-orcamento/

cp backend-orcamento-requirements.txt $HOME/projetos/appcivico/smae/backend-orcamento/
