Ter o apitools instalado

    npm install @openapitools/openapi-generator-cli -g

Ter o JSON da api /api-json

    curl http://127.0.0.1:3002/api-json -o /tmp/out.json


Gerar o arquivo:

    openapi-generator-cli generate -i /tmp/out.json -g typescript-axios --additional-properties=enumPropertyNaming=original,paramNaming=original,useSingleRequestParameter=true --skip-validate-spec -o /tmp/generated

