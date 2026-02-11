# Documentação do Sistema de Geração de Thumbnails

## Visão Geral

Sistema completo de geração de thumbnails para uploads de imagens com processamento de fila de tarefas, capacidades de reprocessamento em massa e endpoints de gerenciamento de configuração.

## Funcionalidades Implementadas

### 1. Sistema de Fila de Tarefas

**Novo Tipo de Tarefa:** `gerar_thumbnail_imagem`

Um trabalhador de tarefa dedicado processa a geração de thumbnails de forma assíncrona:
- Busca o arquivo original do armazenamento
- **SVG**: Sanitiza o SVG usando DOMPurify (remove tags/atributos perigosos como `<script>`, event handlers) e mantém formato SVG
- **Raster (PNG/JPG)**: Converte para WebP usando sharp com redimensionamento
- Armazena o thumbnail no S3 em `uploads/thumbnail/original-arquivo-id-{id}/`
- Vincula o thumbnail via `thumbnail_arquivo_id` na tabela Arquivo
- Não bloqueante: falhas não impedem a conclusão da tarefa

**Arquivos:**
- `src/upload/thumbnail.service.ts` - ThumbnailService implementando TaskableService
- `src/upload/dto/gerar-thumbnail.dto.ts` - DTO de parâmetros da tarefa
- `prisma/migrations/20260210130000_add_gerar_thumbnail_task_type/` - Migração do banco de dados

### 2. Endpoints de Reprocessamento em Massa

#### POST `/solicitar-thumbnail`
Gera thumbnail para um único arquivo por token de upload/download.

**Requisição:**
```json
{
  "token": "upload_or_download_token_here"
}
```

**Resposta:**
```json
{
  "aceito": true,
  "mensagem": "Thumbnail agendado para geração"
}
```

**Autorização:** Requer autenticação

---

#### POST `/processar-thumbnails-pendentes?tipo={TIPO}`
Reprocessa em massa todos os arquivos sem thumbnails.

**Parâmetros de Consulta:**
- `tipo` (opcional): Filtrar por tipo específico
  - `ICONE_TAG`
  - `ICONE_PORTFOLIO`
  - `LOGO_PDM`
  - `FOTO_PARLAMENTAR`

**Resposta:**
```json
{
  "total": 150,
  "agendados": 145,
  "pulados": 5,
  "message": "Processados 150 arquivos. Agendados: 145, Pulados: 5."
}
```

**Autorização:** Requer autenticação

**Exemplos de Uso:**
```bash
# Reprocessar todos os tipos de thumbnail
curl -X POST http://localhost:3000/processar-thumbnails-pendentes \
  -H "Authorization: Bearer $TOKEN"

# Reprocessar apenas ICONE_TAG
curl -X POST "http://localhost:3000/processar-thumbnails-pendentes?tipo=ICONE_TAG" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Endpoints de Configuração de Thumbnail

#### GET `/smae-config/thumbnail`
Lista todas as configurações de tipos de thumbnail com valores atuais.

**Resposta:**
```json
{
  "configs": [
    {
      "tipo": "ICONE_TAG",
      "width": 128,
      "height": 128,
      "quality": 80,
      "fit": "inside",
      "allowSvg": true,
      "configKeys": {
        "width": "THUMB_ICONE_TAG_WIDTH",
        "height": "THUMB_ICONE_TAG_HEIGHT",
        "quality": "THUMB_ICONE_TAG_QUALITY"
      }
    },
    // ... mais tipos
  ]
}
```

**Autorização:** Função `SMAE.sysadmin` necessária

---

#### GET `/smae-config/thumbnail/:tipo`
Obtém configuração para tipo específico de thumbnail.

**Exemplo:** `/smae-config/thumbnail/ICONE_TAG`

**Resposta:**
```json
{
  "tipo": "ICONE_TAG",
  "width": 128,
  "height": 128,
  "quality": 80,
  "fit": "inside",
  "allowSvg": true,
  "configKeys": {
    "width": "THUMB_ICONE_TAG_WIDTH",
    "height": "THUMB_ICONE_TAG_HEIGHT",
    "quality": "THUMB_ICONE_TAG_QUALITY"
  }
}
```

**Autorização:** Função `SMAE.sysadmin` necessária

---

#### PATCH `/smae-config/thumbnail/:tipo`
Atualiza configuração para tipo específico de thumbnail.

**Corpo da Requisição:**
```json
{
  "width": 256,
  "height": 256,
  "quality": 90
}
```

**Resposta:**
```json
[
  {
    "key": "THUMB_ICONE_TAG_WIDTH",
    "value": "256"
  },
  {
    "key": "THUMB_ICONE_TAG_HEIGHT",
    "value": "256"
  },
  {
    "key": "THUMB_ICONE_TAG_QUALITY",
    "value": "90"
  }
]
```

**Autorização:** Função `SMAE.sysadmin` necessária

## Chaves de Configuração

Todos os tipos de thumbnail suportam dimensões e qualidade configuráveis via SmaeConfig:

### ICONE_TAG
- `THUMB_ICONE_TAG_WIDTH` (padrão: 128)
- `THUMB_ICONE_TAG_HEIGHT` (padrão: 128)
- `THUMB_ICONE_TAG_QUALITY` (padrão: 80)

### ICONE_PORTFOLIO
- `THUMB_ICONE_PORTFOLIO_WIDTH` (padrão: 256)
- `THUMB_ICONE_PORTFOLIO_HEIGHT` (padrão: 256)
- `THUMB_ICONE_PORTFOLIO_QUALITY` (padrão: 80)

### LOGO_PDM
- `THUMB_LOGO_PDM_WIDTH` (padrão: 256)
- `THUMB_LOGO_PDM_HEIGHT` (padrão: 256)
- `THUMB_LOGO_PDM_QUALITY` (padrão: 80)

### FOTO_PARLAMENTAR
- `THUMB_FOTO_PARLAMENTAR_WIDTH` (padrão: 200)
- `THUMB_FOTO_PARLAMENTAR_HEIGHT` (padrão: 200)
- `THUMB_FOTO_PARLAMENTAR_QUALITY` (padrão: 80)

## Esquema do Banco de Dados

### Atualizações da Tabela Arquivo

```sql
-- Relação de auto-referência de thumbnail
thumbnail_arquivo_id INT UNIQUE
thumbnail_arquivo    Arquivo? @relation("ArquivoThumbnail", ...)
thumbnail_de         Arquivo? @relation("ArquivoThumbnail")
```

### Fila de Tarefas

Tarefas do tipo `gerar_thumbnail_imagem` com parâmetros:
```json
{
  "arquivo_id": 123,
  "tipo_upload": "ICONE_TAG"
}
```

## Mudanças nas Respostas da API

Todos os endpoints de consumidor agora incluem tokens de download de thumbnail:

### Tag
```json
{
  "icone": "download_token_for_original",
  "icone_thumbnail": "download_token_for_thumbnail"
}
```

### Portfolio
```json
{
  "icone_impressao": {
    "id": 123,
    "download_token": "original_token",
    "thumbnail_download_token": "thumbnail_token"
  }
}
```

### PDM
```json
{
  "logo": "original_token",
  "logo_thumbnail": "thumbnail_token"
}
```

### Parlamentar
```json
{
  "foto": "original_token",
  "foto_thumbnail": "thumbnail_token"
}
```

## Fluxo de Uso

### Configuração Inicial (Opcional)

Configure as dimensões do thumbnail conforme suas necessidades:

```bash
# Aumentar o tamanho do thumbnail ICONE_TAG para 256x256
curl -X PATCH http://localhost:3000/smae-config/thumbnail/ICONE_TAG \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"width": 256, "height": 256, "quality": 85}'
```

### Preenchimento de Uploads Existentes

Processar todos os uploads existentes que não têm thumbnails:

```bash
# Processar todos os tipos
curl -X POST http://localhost:3000/processar-thumbnails-pendentes \
  -H "Authorization: Bearer $TOKEN"

# Ou processar tipo específico
curl -X POST "http://localhost:3000/processar-thumbnails-pendentes?tipo=FOTO_PARLAMENTAR" \
  -H "Authorization: Bearer $TOKEN"
```

### Monitorar Progresso da Tarefa

Verificar a tabela task_queue para status:
```sql
SELECT id, type, status, created_at, started_at, finished_at, error_message
FROM task_queue
WHERE type = 'gerar_thumbnail_imagem'
ORDER BY created_at DESC
LIMIT 20;
```

### Verificar Thumbnails

Verificar quais arquivos têm thumbnails:
```sql
SELECT tipo, COUNT(*) as total,
       COUNT(thumbnail_arquivo_id) as com_thumbnail
FROM arquivo
WHERE tipo IN ('ICONE_TAG', 'ICONE_PORTFOLIO', 'LOGO_PDM', 'FOTO_PARLAMENTAR')
GROUP BY tipo;
```

## Detalhes de Implementação

### Geração Automática

Thumbnails são gerados automaticamente para novos uploads:
1. Usuário faz upload de imagem via `/upload`
2. Validação de imagem é executada (verificação de conteúdo usando sharp para raster, validação de tags SVG para vetores)
3. Arquivo original é criado
4. Geração de thumbnail é acionada (não bloqueante):
   - **SVG**: Sanitizado com DOMPurify para remover XSS e mantido como SVG
   - **PNG/JPG**: Convertido para WebP com dimensões configuráveis
5. Se a geração de thumbnail falhar, o upload original ainda é bem-sucedido

### Regeneração Manual

Para regenerar um thumbnail para um arquivo existente:
1. Obter o token de download para o arquivo
2. Chamar `/solicitar-thumbnail` com o token
3. Tarefa é enfileirada e será processada pelo trabalhador de tarefa

### Processamento de Tarefa

O trabalhador de tarefa (`ThumbnailService`):
1. Baixa o arquivo original do S3
2. Gera thumbnail com processamento específico por formato:
   - **SVG**: Sanitiza usando DOMPurify (remove `<script>`, event handlers, javascript: URIs) mantendo formato vetorial
   - **Raster**: Redimensiona e converte para WebP usando sharp
3. Faz upload do thumbnail para S3 (`thumbnail.svg` ou `thumbnail.webp`)
4. Cria registro Arquivo com `tipo: 'THUMBNAIL'` e mime-type correto (`image/svg+xml` ou `image/webp`)
5. Vincula via `thumbnail_arquivo_id` no Arquivo original

## Arquivos Modificados/Criados

### Novos Arquivos
- `src/upload/thumbnail.service.ts`
- `src/upload/dto/gerar-thumbnail.dto.ts`
- `src/upload/dto/solicitar-thumbnail.dto.ts`
- `src/common/services/thumbnail-config.controller.ts`
- `prisma/migrations/20260210120000_add_thumbnail_arquivo_id/migration.sql`
- `prisma/migrations/20260210130000_add_gerar_thumbnail_task_type/migration.sql`

### Arquivos Modificados
- `src/upload/upload.service.ts` - Adicionados métodos de reprocessamento
- `src/upload/upload.controller.ts` - Adicionados endpoints de reprocessamento
- `src/upload/upload.module.ts` - Registrado ThumbnailService
- `src/task/task.service.ts` - Conectado ThumbnailService no sistema de tarefas
- `src/task/task.parseParams.ts` - Adicionado parsing de tipo de tarefa de thumbnail
- `src/common/services/smae-config.module.ts` - Registrado ThumbnailConfigController
- `prisma/schema.prisma` - Adicionados campos task_type e Arquivo

## Lista de Verificação de Testes

- [ ] Upload de nova imagem → thumbnail gerado automaticamente
- [ ] Chamar `/solicitar-thumbnail` com arquivo existente → thumbnail gerado
- [ ] Chamar `/processar-thumbnails-pendentes` → todos os thumbnails faltantes enfileirados
- [ ] Chamar `/processar-thumbnails-pendentes?tipo=ICONE_TAG` → apenas ICONE_TAG enfileirado
- [ ] GET `/smae-config/thumbnail` → todas as configurações retornadas
- [ ] GET `/smae-config/thumbnail/ICONE_TAG` → configuração específica retornada
- [ ] PATCH `/smae-config/thumbnail/ICONE_TAG` → configuração atualizada
- [ ] Verificar tabela task_queue → tarefas processadas com sucesso
- [ ] Verificar respostas da API → tokens de thumbnail incluídos
- [ ] Falha na geração de thumbnail → upload original ainda bem-sucedido

## Segurança

### Sanitização de SVG

Arquivos SVG carregados são automaticamente sanitizados usando DOMPurify antes de serem armazenados como thumbnails. Isso remove:
- Tags `<script>` e conteúdo executável
- Event handlers (onclick, onload, etc.)
- javascript: URIs
- Tags `<foreignObject>` com conteúdo HTML
- Outras construções que podem representar riscos de XSS

O arquivo SVG **original** permanece inalterado no upload principal. Apenas o thumbnail é sanitizado, garantindo que a versão servida para visualização seja segura enquanto preserva o arquivo original para casos de uso legítimos.

## Solução de Problemas

### Thumbnails não sendo gerados

1. Verificar task_queue para erros:
```sql
SELECT * FROM task_queue
WHERE type = 'gerar_thumbnail_imagem'
  AND status = 'errored'
ORDER BY created_at DESC;
```

2. Verificar logs do trabalhador de tarefa para erros do sharp

3. Verificar se sharp está instalado:
```bash
npm list sharp
```

### Fila de tarefas congestionada

Aumentar trabalhos simultâneos no SmaeConfig:
```sql
INSERT INTO smae_config (key, value)
VALUES ('MAX_CONCURRENT_JOBS', '5')
ON CONFLICT (key) DO UPDATE SET value = '5';
```

### Erros de conteúdo de imagem inválido

O sistema valida o conteúdo da imagem usando sharp. Arquivos renomeados (.txt como .png) serão rejeitados.
