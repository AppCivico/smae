# Padrões do Projeto SMAE

## Backend - Padrões de Desenvolvimento

Para implementação de features no backend NestJS, consulte:
[backend/PATTERNS.md](backend/PATTERNS.md)

Este documento contém:
- Padrões de schema Prisma (audit fields, relações compartilhadas)
- Estrutura de módulos NestJS
- Padrões de service e controller
- Sistema de privilégios
- Workflow de migrations
- Checklist completo para CRUD

## Frontend - Padrão de Props de Rotas

Veja a documentação completa em:
[frontend/src/router/helpers/README.md](frontend/src/router/helpers/README.md)

## Frontend - Padrão de Upload de Ícone/Imagem

Veja a documentação completa em:
[frontend/src/components/InputImageProfile/README.md](frontend/src/components/InputImageProfile/README.md)

## Backend - Funções SQL (PostgreSQL)

Funções SQL customizadas (stored procedures, triggers, views) **não** devem ser criadas como migrations Prisma.
Elas ficam em `backend/prisma/manual-copy/` como arquivos `.pgsql` e são executadas automaticamente na inicialização quando o hash do arquivo muda.

Para criar ou alterar uma função SQL:
1. Crie/edite o arquivo em `backend/prisma/manual-copy/` com extensão `.pgsql`
2. O sistema detecta alterações pelo hash e re-executa o script automaticamente
