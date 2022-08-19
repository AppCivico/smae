# EmailDB

EmailDB usa um banco de dados Pg como uma fila para e-mails transacionais,
então, se você reverter uma transação, você não enviará nenhum e-mail!

Ele também separa os modelos de e-mail do seu back-end, você pode hospedar seus modelos em qualquer lugar com HTTP/HTTPS.

# dependências remotas

- PostgreSQL >= 9.5 - usado como fila (requer o recurso SKIP LOCKED)

Fora isso, você precisa de um servidor SMTP

# Visão geral do back-end

- Escrito em perl, usa cpanfile para controlar deps perl
- Text::Xslate para análise/template
- Email::Sender::Transporte:** para *enviar* e-mails
- Shypper::TemplateResolvers::* para obter textos para passar para Text::Xslate

## Shypper::TemplateResolvers

As classes neste namespace baixam e renderizam os modelos para a classe Email::Sender::Transport

### Shypper::TemplateResolvers::HTTP

As configurações abaixo estão disponíveis:

    base_url - obrigatório
    cache_path - padrão '/tmp/'
    cache_prefix - padrão 'shypper-template-' - prefixo para o nome do arquivo
    cache_timeout - padrão '60', arquivos mais antigos ou iguais a essa configuração serão descartados e recuperados novamente da fonte
    cabeçalhos - sem padrão, definido como array, por exemplo: ["autorização", "Basic 123"]

> obs: suporta HTTPS

# Configurando

Todas as configurações de operações são definidas por meio de variáveis ​​de ambiente ([check file](.env)) para mais informações ou continue lendo.

As configurações dinâmicas são definidas por meio de tabelas, veja abaixo:

Use `$ sqitch deploy` para implantar as tabelas necessárias em seu banco de dados. Ou copie/cole de [email-db-service/deploy_db/deploy/0000-firstversion.sql](email-db-service/deploy_db/deploy/0000-firstversion.sql) e execute em seu postgres.

> No caso do SMAE, está já integrado no migrations do pŕoprio ORM

Insira em `public.emaildb_config` de acordo com suas necessidades.

Quando uma inserção ocorre em `emaildb_queue` este serviço irá enviá-la.

# Iniciando este serviço

O docker-compose.yml da raiz já está configurado com o deploy,
para outros exemplos, veja [no repositório original](https://github.com/eokoe/email-db-service)

Para tentar novamente ou reenviar, defina `errmsg` e `sent` como NULL, então acione `NOTIFY newemail` ou espere o próximo minuto

#configuração ENV

- $ENV{EMAILDB_MAX_WORKERS}=1 # max workers para Parallel::Prefork

- $ENV{EMAILDB_FETCH_ROWS}=100 # número de linhas que cada trabalho tenta bloquear cada vez que consulta o banco de dados

**AVISO**

Usando `EMAILDB_FETCH_ROWS` > 1 pode entregar mais de um e-mail em caso de falha no meio do processamento em lote (desligamento, kill -9, banco de dados desligado).

