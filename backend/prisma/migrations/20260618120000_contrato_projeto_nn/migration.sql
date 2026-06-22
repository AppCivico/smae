-- CreateTable
CREATE TABLE "contrato_projeto" (
    "id" SERIAL NOT NULL,
    "contrato_id" INTEGER NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "contrato_projeto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contrato_projeto_projeto_id_idx" ON "contrato_projeto"("projeto_id");

-- CreateIndex
CREATE INDEX "contrato_projeto_contrato_id_idx" ON "contrato_projeto"("contrato_id");

-- AddForeignKey
ALTER TABLE "contrato_projeto" ADD CONSTRAINT "contrato_projeto_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_projeto" ADD CONSTRAINT "contrato_projeto_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_projeto" ADD CONSTRAINT "contrato_projeto_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_projeto" ADD CONSTRAINT "contrato_projeto_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================================
-- Migração de dados: move o vínculo Contrato->Projeto da coluna direta `contrato.projeto_id`
-- para a nova tabela de relacionamento `contrato_projeto`, fundindo as cópias duplicadas
-- de contratos compartilhados (mesmo portfólio + mesmo número, não-exclusivos).
-- =====================================================================================

-- 1. Cria um vínculo para cada contrato ativo (origem = projeto_id atual)
INSERT INTO "contrato_projeto" ("contrato_id", "projeto_id", "criado_em", "criado_por")
SELECT c."id", c."projeto_id", now(), c."criado_por"
FROM "contrato" c
WHERE c."removido_em" IS NULL;

-- 2. Funde as cópias duplicadas de contratos compartilhados
DO $$
DECLARE
    v_contratos_fundidos INT;
BEGIN
    -- Mapeia cada contrato não-exclusivo ativo ao canônico (menor id) do seu grupo (portfolio, numero)
    CREATE TEMP TABLE tmp_fusao_contrato ON COMMIT DROP AS
    SELECT
        c.id AS contrato_id,
        MIN(c.id) OVER (PARTITION BY p.portfolio_id, lower(c.numero)) AS canonico_id
    FROM contrato c
    JOIN projeto p ON p.id = c.projeto_id
    WHERE c.removido_em IS NULL
      AND c.contrato_exclusivo = false;

    -- Garante o vínculo do canônico para cada projeto/obra das cópias (sem duplicar)
    INSERT INTO contrato_projeto (contrato_id, projeto_id, criado_em, criado_por)
    SELECT DISTINCT f.canonico_id, cp.projeto_id, now(), can.criado_por
    FROM tmp_fusao_contrato f
    JOIN contrato_projeto cp ON cp.contrato_id = f.contrato_id
    JOIN contrato can ON can.id = f.canonico_id
    WHERE f.contrato_id <> f.canonico_id
      AND NOT EXISTS (
          SELECT 1 FROM contrato_projeto cp2
          WHERE cp2.contrato_id = f.canonico_id
            AND cp2.projeto_id = cp.projeto_id
      );

    -- Remove os vínculos das cópias (agora cobertos pelo canônico)
    DELETE FROM contrato_projeto cp
    USING tmp_fusao_contrato f
    WHERE cp.contrato_id = f.contrato_id
      AND f.contrato_id <> f.canonico_id;

    -- Soft-delete das cópias duplicadas, mantendo apenas o contrato canônico
    UPDATE contrato c
    SET removido_em = now(),
        removido_por = c.criado_por
    FROM tmp_fusao_contrato f
    WHERE c.id = f.contrato_id
      AND f.contrato_id <> f.canonico_id;
    GET DIAGNOSTICS v_contratos_fundidos = ROW_COUNT;

    RAISE NOTICE '[contrato_projeto_nn] Cópias de contratos compartilhados fundidas (removidas): %', v_contratos_fundidos;
    RAISE NOTICE '[contrato_projeto_nn] Números ainda repetidos entre contratos ativos (conferir unicidade global): %',
        (SELECT count(*) FROM (SELECT lower(numero) FROM contrato WHERE removido_em IS NULL GROUP BY lower(numero) HAVING count(*) > 1) z);
END $$;

-- 3. Unicidade do vínculo (um contrato não pode ter o mesmo projeto vinculado mais de uma vez)
CREATE UNIQUE INDEX "contrato_projeto_contrato_id_projeto_id_unico"
    ON "contrato_projeto"("contrato_id", "projeto_id")
    WHERE "removido_em" IS NULL;

-- 4. Mantém a coluna antiga `contrato.projeto_id` como DEPRECATED (não é mais a fonte de verdade -
--    a fonte de verdade passa a ser `contrato_projeto`). Remove a FK, renomeia e torna anulável
--    para preservar a origem do contrato sem bloquear novos cadastros (que não preenchem a coluna).
ALTER TABLE "contrato" DROP CONSTRAINT IF EXISTS "contrato_projeto_id_fkey";
ALTER TABLE "contrato" RENAME COLUMN "projeto_id" TO "projeto_id_deprecated";
ALTER TABLE "contrato" ALTER COLUMN "projeto_id_deprecated" DROP NOT NULL;
