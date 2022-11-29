#!/bin/bash

rsync -av /path-to-middleware_orcamento_smae/* /path-to-smae/backend-orcamento/
rsync -av /path-to-middleware_orcamento_smae/.gitignore /path-to-smae/backend-orcamento/
rsync -av /path-to-middleware_orcamento_smae/.env* /path-to-smae/backend-orcamento/