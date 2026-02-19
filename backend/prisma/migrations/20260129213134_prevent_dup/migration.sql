UPDATE grupo_painel_externo_pessoa gpep
SET removido_em = CURRENT_TIMESTAMP
FROM (
        SELECT id
        FROM (
                SELECT id,
                    ROW_NUMBER() OVER (
                        PARTITION BY grupo_painel_externo_id,
                        pessoa_id
                        ORDER BY id
                    ) AS rn
                FROM grupo_painel_externo_pessoa
                WHERE removido_em IS NULL
            ) t
        WHERE rn > 1
    ) dup
WHERE gpep.id = dup.id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_grupo_pessoa_ativo
ON grupo_painel_externo_pessoa (grupo_painel_externo_id, pessoa_id)
WHERE removido_em IS NULL;
