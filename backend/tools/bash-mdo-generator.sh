#!/bin/bash

# Define the number of requests
N=$1

# Define the base URL and headers
URL="http://127.0.0.1:3002/api/projeto-mdo"
HEADERS=(
  -H 'accept: application/json'
  -H 'smae-sistemas: SMAE,PDM,CasaCivil,Projetos,PlanoSetorial,MDO'
  -H 'Authorization: Bearer X'
  -H 'Content-Type: application/json'
)

# Function to generate a random string
generate_random_string() {
  local length=$1
  tr -dc A-Za-z0-9 </dev/urandom | head -c ${length} ; echo ''
}

# Function to generate JSON data with modified strings
generate_json_data() {
  local counter=$1
  local random_name="Projeto $counter $(generate_random_string 8)"
  local random_resumo=$(generate_random_string 16)
  local random_observacoes=$(generate_random_string 16)

  cat <<EOF
{
  "status": "MDO_EmAndamento",
  "origem_tipo": "Outro",
  "portfolio_id": 51,
  "nome": "$random_name",
  "grupo_tematico_id": 1,
  "previsao_custo": "0.0",
  "mdo_detalhamento": "",
  "mdo_programa_habitacional": "",
  "mdo_n_unidades_habitacionais": 0,
  "mdo_n_familias_beneficiadas": 0,
  "origem_outro": "Foobar",
  "orgao_gestor_id": 14,
  "responsaveis_no_orgao_gestor": [],
  "orgaos_participantes": [],
  "orgao_responsavel_id": 1,
  "orgao_origem_id": 1,
  "orgao_executor_id": 1,
  "responsavel_id": 6,
  "resumo": "$random_resumo",
  "mdo_observacoes": "$random_observacoes",
  "tolerancia_atraso": 0,
  "principais_etapas": "1. doing xpto\n2. doing zoo",
  "geolocalizacao": [],
  "secretario_executivo": "",
  "secretario_responsavel": "",
  "fonte_recursos": [],
  "regiao_ids": [],
  "secretario_colaborador": "string",
  "orgao_colaborador_id": 1,
  "colaboradores_no_orgao": []
}
EOF
}

# Loop to send N requests
for ((i=1; i<=N; i++))
do
  DATA=$(generate_json_data $i)
  curl -X 'POST' "${URL}" "${HEADERS[@]}" -d "${DATA}"
done
