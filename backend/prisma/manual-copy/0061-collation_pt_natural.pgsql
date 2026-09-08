-- Collation "natural" para ordenação de texto amigável ao usuário (pt-BR).
--
-- O banco é criado com collation "C" (ordem de bytes): ORDER BY em colunas de texto
-- coloca MAIÚSCULAS antes de minúsculas e trata acentos fora da ordem esperada.
-- Esta collation ICU resolve isso:
--   ks-level1  -> ignora diferença de maiúsc./minúsc. e acentos (força primária)
--   kn-true    -> ordena números embutidos pelo valor numérico ("2" antes de "10")
--   ka-shifted -> ignora pontuação/espaços na comparação
--
-- É NÃO-determinística (deterministic = false), pois strings diferentes podem
-- comparar como iguais. Por isso NÃO deve ser definida como collation padrão de
-- uma coluna (quebraria LIKE/ILIKE nela). Use somente em expressões, por exemplo:
--   ORDER BY nome COLLATE pt_natural
--
-- Como não é usada como collation de coluna/índice, o DROP abaixo é seguro e
-- mantém este arquivo idempotente (re-executado pelo pgsql-migrate quando o hash muda).
DROP COLLATION IF EXISTS pt_natural;
CREATE COLLATION pt_natural (
    provider = icu,
    locale = 'pt-BR-u-ks-level1-kn-true-ka-shifted',
    deterministic = false
);
