# SMAE

Pasta de origem do repositório do SMAE

Acesse [o README do backend](backend/README.md) para instruções de desenvolvimento do backend!

Senha do usuário padrão:

    email: superadmin@admin.com
    senha: !286!QDM7H

Acesse [o README do frontend](frontend/README.md) para instruções de desenvolvimento do frontend!

# Deploy com docker-compose

Copie o arquivo `.env.example` para `.env` e faça as modificações das chaves e portas.

Edite o arquivo `frontend/docker/nginx.conf` trocando o seu host-name, na linha:

    server_name my-custom-host;

ou então mude para

    server_name _;

e remova as linhas:

    server {
        location / {
            return 403;
        }
    }


A configuração do MinIO pode ser trocada pelo S3 ou outro serviço equivalente (e então remover o serviço do MinIO do docker-compose.yaml)

Na primeira vez que subir o sistema com gerenciamento de arquivos via MinIO, será necessário subir o MinIO, criar um bucket, e configurar um usuário e senha para os uploads, e então atualizar o `.env` com as configurações realizadas. Todas essas tarefas podem ser feitas pelo console web, https://min.io/docs/minio/linux/administration/minio-console.html

### Testando configurações

Verifique se há alguma variavel pendente no docker-compose com o comando

    ./testa-config.sh

Não deve aparecer nenhum "WARNING" na tela.

Para realizar o deploy, execute os seguintes comandos:

    git clone https://github.com/\[SEU\_USUARIO\_GIT\]/smae.git
    cd smae
    docker-compose up --build

Isso irá criar e executar todos os contêineres e serviços especificados no arquivo `docker-compose.yaml`.

Para fazer as atualizações de código, repita o processo executando `git pull` e conferindo se há novas configurações no .env.example para entrarem no ambiente de produção.

## Usando o serviço email_service

O `email_service` é responsável por enviar e-mails. Ele acessa as templates dos e-mails na intranet ou pela internet via HTTP ou HTTPS e dispara o envio via SMTP, de acordo com as configurações na tabela. Mais informações podem ser encontradas no arquivo [email-service/README.md](email-service/README.md).

## Usando o serviço smtp_web

O serviço de `smtp_web` é um servidor SMTP fake usado apenas para desenvolvimento. Ele possui uma interface web para que o administrador possa visualizar todos os e-mails "enviados" pelo sistema. Para o ambiente de produção, é necessário um servidor SMTP verdadeiro e a importação das configurações DKIM e SPF. O deploy deste container não é necessário no ambiente de produção.

## Configurando o postgres-backup-local

Caso deseje personalizar as configurações de backup do banco de dados, edite o docker-compose.yaml de acordo

Para cada container com a imagem `postgres:14-bullseye`, existe um outro container com a imagem `prodrigestivill/postgres-backup-local`. Este é responsável por fazer backup do PostgreSQL local no sistema de arquivos.

Existem diversas variáveis que podem ser personalizadas:

*   `POSTGRES_HOST`: Nome do host onde se encontra o banco de dados PostgreSQL que você deseja fazer backup.
*   `POSTGRES_DB`: Nome do banco de dados PostgreSQL que será feito o backup.
*   `POSTGRES_USER`: Nome do usuário utilizado para se conectar ao banco de dados PostgreSQL.
*   `POSTGRES_PASSWORD`: Senha do usuário utilizado para se conectar ao banco de dados PostgreSQL.
*   `POSTGRES_EXTRA_OPTS`: Opções adicionais para o comando `pg_dump`, que será utilizado para fazer o backup.
*   `SCHEDULE`: Cronograma do backup. Use o formato cron para especificar intervalos, como `@hourly`, `@daily` etc.
*   `BACKUP_KEEP_MINS`: Número de minutos que os backups serão armazenados na pasta "last".
*   `BACKUP_KEEP_DAYS`: Número de dias que os backups diários serão armazenados.
*   `BACKUP_KEEP_WEEKS`: Número de semanas que os backups semanais serão armazenados.
*   `BACKUP_KEEP_MONTHS`: Número de meses que os backups mensais serão armazenados.
*   `HEALTHCHECK_PORT`: Porta que verifica a saúde do container.

## Configuração de painéis incorporados do Metabase

Disponível na versão open-source do metabase, é possível configurar embed via token signed dentro do SMAE, abrindo um menu lateral de analises.

Veja os detalhes do metabase+SMAE em [metabase.md](metabase.md) ou a documentação completa em https://www.metabase.com/docs/latest/embedding/introduction#signed-embedding

## Restaurando um backup do banco de dados

Para restaurar um backup do banco de dados PostgreSQL, siga os passos abaixo:

1. **Inicie apenas o serviço do banco de dados:**

./inicia-db.sh

2. **Copie o arquivo `.sql` para dentro do container:**

```bash
docker cp seu_backup.sql smae_postgres:/tmp/
```
Substitua `seu_backup.sql` pelo nome do seu arquivo de backup.

3. **Acesse o container:**

```bash
docker exec -it smae_postgres bash
```

4. **Restaure o banco de dados:**

```bash
psql -U smae -d smae_dev_persistent -f /tmp/seu_backup.sql
```

Lembre-se de substituir `seu_backup.sql` pelo nome do arquivo que você copiou e `smae_dev_persistent`  pelo nome do seu banco de dados, caso seja diferente.

5. **Saia do container:**

```bash
exit
```


# Licença

[Licença Pública Geral Affero GNU](LICENSE)

