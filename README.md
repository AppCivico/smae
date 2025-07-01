# SMAE

Pasta de origem do repositório do SMAE

Acesse [o README do backend](backend/README.md) para instruções de desenvolvimento do backend!

Senha do usuário padrão:

    email: superadmin@admin.com
    senha: !286!QDM7H

Acesse [o README do frontend](frontend/README.md) para instruções de desenvolvimento do frontend!

# Pré-requisitos

- **Git**: Para clonar o repositório.
- **Docker e Docker Compose**: Essencial para rodar a aplicação. Recomenda-se a versão mais recente do Docker, que já inclui o `docker compose` (sem o hífen).
  - Para instruções de instalação, siga o [guia oficial do Docker](https://docs.docker.com/engine/install/ubuntu/).
  - **(Importante)** Para evitar usar `sudo` em todos os comandos do Docker, adicione seu usuário ao grupo `docker`:
    ```bash
    sudo usermod -aG docker ${USER}
    ```
    Depois disso, faça logout e login novamente para que a alteração tenha efeito.

# Guia de Implantação com Docker Compose

Este guia cobre a implantação completa da stack, incluindo o frontend e o servidor de e-mail de desenvolvimento.

## 1. Clonando o Repositório

Clone o projeto usando HTTPS para um acesso mais simples:

```bash
git clone https://github.com/AppCivico/smae.git
cd smae
```

## 2. Configurando o Ambiente

Copie o arquivo de exemplo `.env.example` para `.env` e preencha com suas chaves e configurações.

```bash
cp .env.example .env
nano .env
```

> **Atenção:** A variável `PRISMA_FIELD_ENCRYPTION_KEY` é **crítica**. Se você estiver restaurando um backup, ela **deve** ser idêntica à chave usada no ambiente de origem, caso contrário os dados criptografados no banco serão perdidos.

### Testando configurações

Verifique se há alguma variavel pendente no docker-compose com o comando

    ./testa-config.sh

Não deve aparecer nenhum "WARNING" na tela.

## 3. Usando Docker Compose Profiles

Este projeto utiliza **Profiles** para gerenciar serviços opcionais. Os serviços principais rodam por padrão, enquanto o `web` (frontend) e o `smtp_web` (SMTP de desenvolvimento) estão no profile `fullStack`.

Para subir a stack completa, use a flag `--profile`:

```bash
# Inicia todos os serviços, incluindo os do profile 'fullStack'
docker compose --profile fullStack up --build -d
```

> Se você precisar iniciar apenas o backend (por exemplo, para uma API), omita a flag `--profile`.

## 4. Configuração do Nginx do Frontend

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

## 5. Configuração de Armazenamento de Arquivos

A configuração do MinIO pode ser trocada pelo S3 ou outro serviço equivalente (e então remover o serviço do MinIO do docker-compose.yaml).

Na primeira vez que subir o sistema com gerenciamento de arquivos via MinIO, será necessário subir o MinIO, criar um bucket, e configurar um usuário e senha para os uploads, e então atualizar o `.env` com as configurações realizadas. Todas essas tarefas podem ser feitas pelo console web, https://min.io/docs/minio/linux/administration/minio-console.html

## 6. Restaurando um Backup (Se Aplicável)

Para restaurar um backup do banco de dados PostgreSQL, siga os passos abaixo:

1. **Inicie apenas o serviço do banco de dados:**

```bash
./inicia-db.sh
```

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

Lembre-se de substituir `seu_backup.sql` pelo nome do arquivo que você copiou e `smae_dev_persistent` pelo nome do seu banco de dados, caso seja diferente.

5. **Saia do container:**

```bash
exit
```

## 7. Ajustes Críticos Pós-Restauração

Após restaurar um banco de dados de produção em um ambiente de teste/homologação, alguns passos são essenciais:

### a. Corrigindo o erro "403 Forbidden" no Frontend

O Nginx dentro do contêiner do frontend precisa saber qual domínio ele deve responder.

1. Edite o arquivo `frontend/docker/nginx.conf`.
2. Altere a linha `server_name my-custom-host;` para o seu domínio (ex: `server_name teste-smae.prefeitura.sp.gov.br;`).
3. Reconstrua a imagem do contêiner para que a mudança tenha efeito:
   ```bash
   docker compose --profile fullStack up -d --build
   ```

### b. Resetando a Configuração de SMTP

Para evitar o envio de e-mails reais a partir de um ambiente de teste, aponte a configuração para o servidor SMTP falso (`smtp_web`).

1. Conecte-se ao banco de dados:
   ```bash
   docker exec -it smae_postgres psql -U smae -d smae_dev_persistent
   ```
2. Execute o comando SQL para atualizar a configuração:
   ```sql
   UPDATE emaildb_config SET config = jsonb_set(config, '{sender,args}', '{"host": "smae_emaildb_smtp_web", "port": 25}'::jsonb) WHERE id = (SELECT id FROM public.emaildb_config WHERE ativo = true ORDER BY id LIMIT 1);
   ```

## (Opcional, mas Recomendado) Configurando um Reverse Proxy com Nginx e SSL

Para expor a aplicação na internet de forma segura (HTTPS), recomendamos usar o Nginx como reverse proxy no servidor host.

1. **Instale o Nginx e o Certbot:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y nginx certbot python3-certbot-nginx
   ```

2. **Crie um arquivo de configuração** em `/etc/nginx/sites-available/smae.conf` com o seguinte conteúdo (substitua os domínios e portas pelos seus):

   ```nginx
   server {
       server_name seu-dominio-smae.com.br;

       location / {
           proxy_pass http://127.0.0.1:45902; # Porta do SMAE_WEB_LISTEN
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_buffering off;
           proxy_request_buffering off;
           proxy_http_version 1.1;
           proxy_intercept_errors on;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:45000; # Porta do SMAE_API_LISTEN
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_buffering off;
           proxy_request_buffering off;
           proxy_http_version 1.1;
           proxy_intercept_errors on;
       }
   }

   server {
       server_name seu-dominio-smtp.com.br;
       auth_basic "Acesso Restrito";
       auth_basic_user_file /etc/nginx/.htpasswd;

       location / {
           proxy_pass http://127.0.0.1:3004; # Porta do SMTP_WEB_LISTEN
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_buffering off;
           proxy_request_buffering off;
           proxy_http_version 1.1;
           proxy_intercept_errors on;
       }
   }
   ```

3. **Crie um arquivo de senha para proteger o SMTP web:**
   ```bash
   sudo htpasswd -c /etc/nginx/.htpasswd admin
   ```

4. **Ative a configuração e obtenha os certificados SSL:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/smae.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx
   ```

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

# Licença

[Licença Pública Geral Affero GNU](LICENSE)