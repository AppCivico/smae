#!/bin/bash

rsync -av /path-to/middleware_orcamento_smae /path-to/smae/backend-orcamento
rm /path-to/smae/backend-orcamento/.git
