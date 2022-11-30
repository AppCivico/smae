#! /bin/bash

#tenta criar o ambiente. vai falhar se ja existir
set +e
python -m venv venv
set -e

if [ -f ".env" ]; then
    echo ".env exists, skipping copy"
else
    echo ".env does not exist. copying from .env.example"
    cp .env.example .env
fi

source .env

source venv/bin/activate

pip install -r requirements.txt

uvicorn api:app --host 0.0.0.0 --port 80 --reload