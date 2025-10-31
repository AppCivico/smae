***

### **Guia Completo de Implantação do SMAE com Nginx, SSL e Docker Profiles**

Este guia apresenta o passo a passo completo para implantar a stack da aplicação SMAE em um novo servidor Ubuntu 24.04. O processo cobre desde a implantação dos serviços de backend, a ativação do frontend e do servidor de e-mail de desenvolvimento usando **Docker Compose Profiles**, até a configuração de um reverse proxy seguro com Nginx e certificados SSL da Let's Encrypt.

---

### **Pré-requisitos**

Antes de começar, garanta que você tenha:

1.  **Servidor:** Um servidor Ubuntu 24.04 limpo, com acesso root ou `sudo`.
2.  **DNS:** Registros DNS do tipo `A` apontando seus domínios para o IP público do servidor. Neste guia, usamos:
    *   `teste-smae-prefeitura-sp-gov-br.example.com` (Aplicação Principal)
    *   `teste-smtp-prefeitura-sp-gov-br.example.com` (Visualizador de E-mails)
3.  **Arquivos de Backup:** Os seguintes arquivos devem estar no diretório `/home/smae/` do servidor:
    *   `dump.sql` (Backup do banco de dados principal do SMAE)
    *   `metadb.sql` (Backup do banco de dados do Metabase)
    *   `minio.tar` (Backup do armazenamento de arquivos do MinIO)
    *   `.env.backup` (O arquivo `.env` do servidor de origem)

---

### **Parte 1: Preparação do Servidor e Implantação do Backend**

#### **Passo 1: Instalar o Docker e o Git**

Primeiro, vamos preparar o servidor com as ferramentas necessárias.

```bash
# Atualiza a lista de pacotes e instala as dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl git

# Adiciona a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adiciona o repositório do Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Atualiza a lista de pacotes novamente e instala o Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### **Passo 2: Clonar o Repositório e Preparar os Dados**

Vamos clonar o projeto e criar os diretórios para os dados persistentes.

```bash
# Navegue até o diretório do usuário
cd /home/smae

# Clone o projeto via HTTPS
git clone https://github.com/AppCivico/smae.git
cd smae

# Defina a variável de ambiente para o caminho dos volumes
export DATA_PATH=/home/smae/smae-data

# Crie os diretórios de dados
mkdir -p ${DATA_PATH}/smae_pg_data
mkdir -p ${DATA_PATH}/smae_pg_metabase_data
mkdir -p ${DATA_PATH}/smae_email_data
mkdir -p ${DATA_PATH}/smae_minio_data
mkdir -p ${DATA_PATH}/smae_backup_smae_pg
mkdir -p ${DATA_PATH}/smae_backup_metabase_pg

# Restaure os dados do MinIO a partir do arquivo de backup
sudo tar -xf /home/smae/minio.tar -C ${DATA_PATH}/smae_minio_data/
```

#### **Passo 3: Configurar o Ambiente**

O arquivo `.env` é vital, pois contém todos os segredos e configurações.

```bash
# Copie o arquivo de backup para o projeto com o nome .env
cp /home/smae/.env.backup /home/smae/smae/.env

# Abra o arquivo .env para verificar e, se necessário, atualizar as URLs
# (URL_LOGIN_SMAE, API_HOST_NAME) para o novo ambiente. Não esqueça da propria DATA_PATH, essa é a de máxima importancia.
sudo nano /home/smae/smae/.env
```

#### **Passo 4: Restaurar os Bancos de Dados**

Com os dados no lugar, vamos restaurar os bancos de dados.

```bash
# Inicie apenas os contêineres dos bancos de dados
sudo docker compose -f docker-compose.fixed-path.yml up -d db metadb_postgres

# Copie o dump do banco principal para o contêiner do postgres
sudo docker cp /home/smae/dump.sql prod_smae_postgres:/tmp/dump.sql

# Execute o psql para restaurar o banco de dados principal do SMAE
sudo docker exec -it prod_smae_postgres psql -U smae -d smae_dev_persistent -f /tmp/dump.sql

# Copie o dump do Metabase para o seu contêiner
sudo docker cp /home/smae/metadb.sql prod_smae_api_metadb_postgres:/tmp/metadb.sql

# Restaure o banco de dados do Metabase
sudo docker exec -it prod_smae_api_metadb_postgres psql -U postgres -d metabase -f /tmp/metadb.sql
```

Neste ponto, a base de dados e os serviços de backend estão prontos.

---

### **Parte 2: Implantação da Stack Completa com Profiles**

#### **Passo 5: Ativar o Profile `fullStack`**

O arquivo `docker-compose.fixed-path.yml` usa **Profiles** para iniciar serviços opcionais como o `web` (frontend) e o `smtp_web` (SMTP de desenvolvimento). Vamos ativá-los agora.

```bash
cd /home/smae/smae
sudo docker compose -f docker-compose.fixed-path.yml --profile fullStack up -d
```
Este comando sobe a aplicação completa, incluindo os serviços marcados com o perfil `fullStack`.

---

### **Parte 3: Configurando o Nginx como Reverse Proxy com SSL**

Para expor a aplicação de forma segura na internet, usaremos o Nginx.

#### **Passo 6: Instalar o Nginx e o Certbot**

```bash
sudo apt-get update
sudo apt-get install -y nginx-extras certbot python3-certbot-nginx
```

#### **Passo 7: Criar a Configuração do Nginx**

Crie um arquivo de configuração para os seus domínios. Editaremos o arquivo padrão para simplificar.

```bash
sudo nano /etc/nginx/sites-enabled/default
```

Cole a configuração abaixo. Ela cria um reverse proxy para a aplicação principal e para o visualizador de e-mails, apontando para as portas que os contêineres expõem no host.

```nginx
# /etc/nginx/sites-enabled/default

server {
    server_name teste-smae-prefeitura-sp-gov-br.example.com;

    location / {
        proxy_pass http://172.17.0.1:45909; # Porta do SMAE_WEB_LISTEN
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name teste-smtp-prefeitura-sp-gov-br.example.com;

    location / {
        proxy_pass http://172.17.0.1:32768; # Porta do SMTP_WEB_LISTEN
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### **Passo 8: Obter e Instalar os Certificados SSL**

O Certbot automatiza a criação dos certificados SSL e a configuração do Nginx.

```bash
# Solicite os certificados para ambos os domínios
sudo certbot --nginx -d teste-smae-prefeitura-sp-gov-br.example.com -d teste-smtp-prefeitura-sp-gov-br.example.com

# Siga as instruções na tela. O Certbot irá editar seu arquivo do Nginx
# automaticamente, adicionando as configurações de SSL e o redirecionamento de HTTP para HTTPS.
```

---

### **Parte 4: Ajustes Finais Pós-Implantação**

#### **Passo 9: Corrigir o Erro `403 Forbidden` no Frontend**

Um detalhe importante: por padrão, a configuração do Nginx dentro do contêiner do frontend (`web`) pode bloquear requisições se o `server_name` não corresponder ao domínio acessado.

1.  **Edite o arquivo `nginx.conf` do frontend:**
    ```bash
    sudo nano /home/smae/smae/frontend/docker/nginx.conf
    ```

2.  Encontre a linha `server_name my-custom-host;` e troque pelo seu domínio:
    ```nginx
    server_name teste-smae-prefeitura-sp-gov-br.example.com;
    ```

3.  **Reconstrua e reinicie os contêineres** para aplicar a mudança. A flag `--build` é essencial.
    ```bash
    cd /home/smae/smae
    sudo docker compose -f docker-compose.fixed-path.yml --profile fullStack up -d --build
    ```
    Após isso, a aplicação em `https://teste-smae-prefeitura-sp-gov-br.example.com` deve carregar corretamente.

#### **Passo 10: Configurações Essenciais do Banco de Dados no Novo Ambiente**

Como o banco de dados foi restaurado de um backup de produção, duas mudanças são cruciais.

1.  **Instale o cliente `psql` no host** para facilitar o acesso ao banco.
    ```bash
    sudo apt-get update
    sudo apt-get install -y postgresql-client
    ```

2.  **Redefina o SMTP para usar o servidor falso.** Isso evita o envio acidental de e-mails reais.
    ```bash
    # Conecte-se ao banco de dados
    PGPASSWORD=smae psql -h 127.0.0.1 -p 25432 -U smae -d smae_dev_persistent

    # Dentro do psql, execute o comando de atualização:
    UPDATE emaildb_config SET config = jsonb_set(config, '{sender,args}', '{"host": "prod_smae_emaildb_smtp_web", "port": 25, "ssl": 0, "sasl_username": null, "sasl_password": null}'::jsonb) WHERE id = (SELECT id FROM public.emaildb_config WHERE ativo = true ORDER BY id LIMIT 1);

    # Saia do psql
    \q
    ```

3.  **Adicione configurações que possam faltar** (ex: `WIKI_PREFIX`).
    ```bash
    PGPASSWORD=smae psql -h 127.0.0.1 -p 25432 -U smae -d smae_dev_persistent
    INSERT INTO public.smae_config (key, value) VALUES ('WIKI_PREFIX', 'https://www.google.com');
    \q
    ```

#### **Passo 11: Proteger a Interface Web do SMTP**

**Nota:** Esta etapa é específica para proteger uma ferramenta de desenvolvimento e não faz parte do deploy padrão da aplicação SMAE em si.

1.  **Instale o `apache2-utils` para ter acesso ao comando `htpasswd`.**
    ```bash
    sudo apt-get install -y apache2-utils
    ```

2.  **Crie um arquivo de senhas.** Será solicitado que você crie uma senha para o usuário `smaepref`.
    ```bash
    sudo htpasswd -c /etc/nginx/.htpasswd smaepref
    ```

3.  **Atualize a configuração do Nginx** para o domínio do SMTP.
    ```bash
    sudo nano /etc/nginx/sites-enabled/default
    ```

4.  Adicione as duas linhas de `auth_basic` ao bloco `server` do `teste-smtp-prefeitura-sp-gov-br.example.com`:
    ```nginx
    server {
        server_name teste-smtp-prefeitura-sp-gov-br.example.com;

        # Adicione estas duas linhas para proteção por senha
        auth_basic "Acesso Restrito";
        auth_basic_user_file /etc/nginx/.htpasswd;

        location / {
            # ... as diretivas de proxy_pass continuam as mesmas ...
        }
        # ... as configurações de SSL do certbot continuam as mesmas ...
    }
    ```

5.  **Teste e recarregue a configuração do Nginx.**
    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

---

### **Parte 5: Migrando para os Domínios de Produção Finais**

Quando os domínios finais estiverem disponíveis, o processo de migração segue estes passos. No exemplo abaixo, migramos para os domínios de produção da Prefeitura de São Paulo:

- **Aplicação Principal:** `smaehomol.prefeitura.sp.gov.br` e `www.smaehomol.prefeitura.sp.gov.br`
- **Visualizador de E-mails:** `smaehomolsmtp.prefeitura.sp.gov.br` e `www.smaehomolsmtp.prefeitura.sp.gov.br`

#### **Passo 1: Atualizar o Arquivo `.env`**

```bash
cd /home/smae/smae
sudo nano .env
```

Altere os valores das seguintes variáveis para os novos domínios:
```bash
URL_LOGIN_SMAE=https://smaehomol.prefeitura.sp.gov.br
API_HOST_NAME=smaehomol.prefeitura.sp.gov.br
```

#### **Passo 2: Atualizar a Configuração do Nginx**

```bash
sudo nano /etc/nginx/sites-enabled/default
```

Substitua os domínios antigos pelos novos em todas as diretivas `server_name`:

```nginx
# /etc/nginx/sites-enabled/default

server {
    server_name smaehomol.prefeitura.sp.gov.br www.smaehomol.prefeitura.sp.gov.br;

    location / {
        proxy_pass http://172.17.0.1:45909; # Porta do SMAE_WEB_LISTEN
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name smaehomolsmtp.prefeitura.sp.gov.br www.smaehomolsmtp.prefeitura.sp.gov.br;

    # Proteção por senha (se necessário)
    auth_basic "Acesso Restrito";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://172.17.0.1:32768; # Porta do SMTP_WEB_LISTEN
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### **Passo 3: Atualizar a Configuração do Frontend**

```bash
sudo nano /home/smae/smae/frontend/docker/nginx.conf
```

Altere a linha `server_name` para o novo domínio principal:
```nginx
server_name smaehomol.prefeitura.sp.gov.br;
```

#### **Passo 4: Recarregar a Configuração do Nginx**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### **Passo 5: Obter os Novos Certificados SSL**

Execute o Certbot para todos os domínios (principal e SMTP, incluindo as versões com `www`):

```bash
sudo certbot --nginx -d smaehomolsmtp.prefeitura.sp.gov.br -d smaehomol.prefeitura.sp.gov.br -d www.smaehomol.prefeitura.sp.gov.br -d www.smaehomolsmtp.prefeitura.sp.gov.br
```

O Certbot detectará os novos domínios e guiará você na emissão dos novos certificados, atualizando automaticamente a configuração do Nginx.

#### **Passo 6: Reconstruir e Reiniciar os Contêineres**

Execute o Docker Compose com a flag `--build` para incorporar as mudanças:

```bash
cd /home/smae/smae
sudo docker compose -f docker-compose.fixed-path.yml --profile fullStack up -d --build
```

**Nota:** Se apenas o contêiner do frontend precisar ser reconstruído, você pode usar:
```bash
sudo docker compose -f docker-compose.fixed-path.yml --profile fullStack up web -d --build
```

#### **Passo 7: Verificar o Status dos Serviços**

```bash
# Verificar se todos os contêineres estão rodando
sudo docker ps

# Monitorar os logs da API (se necessário)
sudo docker logs --tail 100 -f prod_smae_api
```

#### **Passo 8: Validação Final**

1. **Teste a aplicação principal:** Acesse `https://smaehomol.prefeitura.sp.gov.br`
2. **Teste o visualizador de e-mails:** Acesse `https://smaehomolsmtp.prefeitura.sp.gov.br` (se configurado com autenticação, use as credenciais criadas)
3. **Verifique os certificados SSL:** Confirme que os certificados estão válidos e que o redirecionamento HTTPS funciona
4. **Teste as funcionalidades:** Faça login na aplicação e teste as principais funcionalidades para garantir que tudo está funcionando corretamente

---

### **Comandos de Manutenção Úteis**

```bash
# Renovar certificados SSL (automático via cron, mas pode ser executado manualmente)
sudo certbot renew

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Reiniciar serviços específicos
sudo docker compose -f docker-compose.fixed-path.yml restart api
sudo docker compose -f docker-compose.fixed-path.yml restart web

# Verificar configuração do Nginx
sudo nginx -t

# Recarregar configuração do Nginx sem interrupção
sudo systemctl reload nginx
```