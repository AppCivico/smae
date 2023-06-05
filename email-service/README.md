# EmailDB

EmailDB usa um banco de dados Pg como uma fila para e-mails transacionais, então, se você reverter uma transação, você não enviará nenhum e-mail!

Ele também separa os modelos de e-mail do seu back-end, você pode hospedar seus modelos em qualquer lugar com HTTP/HTTPS.

## TLDR

Configuração do email fica na tabela `emaildb_config`, a cada mudança reinicie os containers. A fila fica na tabela `emaildb_queue`, para tentar novamente ou **reenviar um email**, defina `errmsg` e `sent` como NULL, então rode `NOTIFY newemail` ou espere o próximo minuto para que o serviço tente automaticamente.


# Visão geral

O emaildb irá baixar a template de um serviço HTTP(s) e irá executar a transposição das varáveis para formar o HTML para o disparo do email, que então será encaminhado para o SMTP server configurado.

O parser das templates é o `Text::Xslate` e as regras são das da [Template-Toolkit](http://template-toolkit.org/docs/manual/Intro.html), que suportam loop, ifs, escaping do html, etc.

As classes para download e envio sao customizáveis, mas as que estão inclusas no container são as seguintes:

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

No caso do SMAE, está já integrado no migrations do próprio Prisma, não é necessário nenhum migration para o serviço do emaildb.

O [seed.ts](../backend/prisma/seed.ts) já insere no `public.emaildb_config` os valores fake para o STMP fake.

Quando uma inserção ocorre em `emaildb_queue` este serviço irá enviá-la.

# Iniciando este serviço

O docker-compose.yml da raiz já está configurado com o deploy,
para outros exemplos, veja [no repositório original](https://github.com/eokoe/email-db-service)


# configuração via ENV

*   $ENV{EMAILDB_MAX_WORKERS}=1 # max workers para Parallel::Prefork

*   $ENV{EMAILDB_FETCH_ROWS}=100 # número de linhas que cada trabalho tenta bloquear cada vez que consulta o banco de dados

**AVISO**

Usando `EMAILDB_FETCH_ROWS` > 1 pode entregar mais de um e-mail em caso de falha no meio do processamento em lote (desligamento, kill -9, banco de dados desligado).

