# SMAE

Pasta de origem do repositório do SMAE

Acesse [o README do backend](backend/README.md) para instruções de desenvolvimento do backend!

Senha do usuário padrão:

    email: superadmin@admin.com
    senha: !286!QDM7H

Acesse [o README do frontend](frontend/README.md) para instruções de desenvolvimento do backend!

# Deploy com docker-compose

Copie o arquivo `.env.example` para `.env` e faça as modificações das chaves e portas.

A configuração do MinIO pode ser trocada pelo S3 ou outro serviço equivalente (e então remover o serviço do MinIO do docker-compose.yaml)


## Configuração de painéis incorporados do Metabase

Disponível na versão open-source do metabase, é possível configurar embed via token signed dentro do smae, abrindo um menu lateral de analises.

> documentação (metabase): https://www.metabase.com/docs/latest/embedding/introduction#signed-embedding

Para que o usuário veja o menu lateral, é necessário que tenha pelo menos 1 das seguinte permissões:

    - Reports.dashboard_pdm
    - Reports.dashboard_portfolios

Para que os sub-menus sejam carregados, insira na tabela `metabase_permissao` de acordo com as preferências e painéis criados no metabase:

    - permissão: qual permissão o usuário (do SMAE) precisa ter para visualizar esse painel
    - configuração: JSON com que o metabase fornece para incorporação do painel.
    - metabase_url: url (pura) do metabase (sem path)
    - metabase_token: token para assinar o JWT (pegar da configuração do metabase)
    - ordem: qual ordem apresentar os botões
    - titulo: título do botão dentro do metabase

    Caso exista o `params.projetos_ids` será substituído pelo ids dos projetos que o usuário logado pode visualizar
    Caso exista o `params.metas_ids` será substituído pelo ids das metas que o usuário logado pode visualizar
    Caso exista o `params.pdm_id` será gerado um link de embed para cada PDM que existe registrado no sistema

Exemplo de configuração da tabela:

    -[ RECORD 1 ]--+------------------------------------------------------------------------------
    id             | 1
    permissao      | Reports.dashboard_portfolios
    configuracao   | {"resource": { "dashboard": 6 }, "params": { "projetos_ids": {}}}
    metabase_url   | https://subdomain.dominio-do-metabase.tld:443
    metabase_token | metabase-secret-token
    ordem          | 1
    titulo         | Gestão de projetos
    -[ RECORD 2 ]--+------------------------------------------------------------------------------
    id             | 2
    permissao      | Reports.dashboard_pdm
    configuracao   |  {"resource": { "dashboard": 5 }, "params": {"metas_ids": {}, "pdm_id": {} }}
    metabase_url   | https://subdomain.dominio-do-metabase.tld:443
    metabase_token | metabase-secret-token
    ordem          | 2
    titulo         | Programa de Metas
