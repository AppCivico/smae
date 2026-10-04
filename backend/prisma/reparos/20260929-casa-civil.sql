-- Reparo pontual dos caches da Casa Civil (PR #668). Idempotente.
-- Rodar uma vez após o deploy, depois de `prisma migrate deploy` e do runner de manual-copy
-- (precisa das funções/triggers novas 0039 e 0064). Ex.: psql -v ON_ERROR_STOP=1 -f 20260929-casa-civil.sql

-- 850f7e4d6: recalcula transferencia_status_consolidado (triggers antigos nunca disparavam em bancos existentes)
SELECT atualiza_transferencia_status_consolidado(t.id)
FROM transferencia t
ORDER BY t.id;

-- 5fffa1b64: parlamentar.vetores_busca NULL faz o trigger BEFORE UPDATE recalcular (partido renomeado)
UPDATE parlamentar p
SET vetores_busca = NULL
WHERE EXISTS (
    SELECT 1 FROM parlamentar_mandato pm
    WHERE pm.parlamentar_id = p.id AND pm.removido_em IS NULL AND pm.partido_candidatura_id IS NOT NULL
);

-- 5fffa1b64 e 1fd23cbee: reconstrói transferencia.vetores_busca (órgão, tipo, partido, parlamentar, distribuição removida)
UPDATE transferencia
SET vetores_busca = f_rebuild_transferencia_tsvector(id)
WHERE removido_em IS NULL;
