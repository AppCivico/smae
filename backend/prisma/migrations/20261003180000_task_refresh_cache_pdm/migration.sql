-- Invalidação do cache de acesso/status do PDM legado sai do COMMIT de quem escreve e vira tarefa
-- (triggers em manual-copy/0062-triggers-invalida-acesso-pdm.pgsql)
ALTER TYPE "task_type" ADD VALUE 'refresh_cache_pdm';
