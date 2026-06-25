-- AlterTable
ALTER TABLE "pdm" ADD COLUMN     "monitoramento_por_blocos" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "pdm_monitoramento_fase_config" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "ordem" SMALLINT NOT NULL,
    "habilitada" BOOLEAN NOT NULL DEFAULT true,
    "rotulo" TEXT NOT NULL,
    "aceita_tags" BOOLEAN NOT NULL DEFAULT false,
    "aceita_anexos" BOOLEAN NOT NULL DEFAULT false,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "pdm_monitoramento_fase_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdm_monitoramento_bloco_config" (
    "id" SERIAL NOT NULL,
    "fase_id" INTEGER NOT NULL,
    "ordem" SMALLINT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "rotulo" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "pdm_monitoramento_bloco_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pdm_monitoramento_fase_config_pdm_id_idx" ON "pdm_monitoramento_fase_config"("pdm_id");

-- CreateIndex
CREATE INDEX "pdm_monitoramento_bloco_config_fase_id_idx" ON "pdm_monitoramento_bloco_config"("fase_id");

-- AddForeignKey
ALTER TABLE "pdm_monitoramento_fase_config" ADD CONSTRAINT "pdm_monitoramento_fase_config_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_monitoramento_fase_config" ADD CONSTRAINT "pdm_monitoramento_fase_config_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_monitoramento_fase_config" ADD CONSTRAINT "pdm_monitoramento_fase_config_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_monitoramento_fase_config" ADD CONSTRAINT "pdm_monitoramento_fase_config_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_monitoramento_bloco_config" ADD CONSTRAINT "pdm_monitoramento_bloco_config_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "pdm_monitoramento_fase_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_monitoramento_bloco_config" ADD CONSTRAINT "pdm_monitoramento_bloco_config_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_monitoramento_bloco_config" ADD CONSTRAINT "pdm_monitoramento_bloco_config_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_monitoramento_bloco_config" ADD CONSTRAINT "pdm_monitoramento_bloco_config_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex (partial unique: só vale para linhas não removidas; reuso de `ordem` após soft-delete é permitido)
CREATE UNIQUE INDEX "pdm_monit_fase_pdm_ordem_uniq"
    ON "pdm_monitoramento_fase_config" ("pdm_id", "ordem") WHERE "removido_em" IS NULL;

CREATE UNIQUE INDEX "pdm_monit_bloco_fase_ordem_uniq"
    ON "pdm_monitoramento_bloco_config" ("fase_id", "ordem") WHERE "removido_em" IS NULL;

-- Backfill: habilita as 4 fases padrão do monitoramento para PdM/PS NÃO-legados existentes.
-- Legados (sistema='PDM') ficam de fora; monitoramento_por_blocos permanece false para todos (default).
-- criado_por = -1 (CONST_BOT_USER_ID).
WITH alvo AS (
    SELECT id AS pdm_id
    FROM pdm
    WHERE sistema IN ('PlanoSetorial', 'ProgramaDeMetas')
      AND removido_em IS NULL
),
fases_novas AS (
    INSERT INTO pdm_monitoramento_fase_config
        (pdm_id, ordem, habilitada, rotulo, aceita_tags, aceita_anexos, criado_por, criado_em)
    SELECT a.pdm_id, v.ordem, true, v.rotulo, v.aceita_tags, v.aceita_anexos, -1, now()
    FROM alvo a
    CROSS JOIN (VALUES
        (1::smallint, 'Qualificação',          false, true),
        (2::smallint, 'Análise de risco',      false, false),
        (3::smallint, 'Tags de monitoramento', true,  false),
        (4::smallint, 'Fechamento',            false, false)
    ) AS v(ordem, rotulo, aceita_tags, aceita_anexos)
    RETURNING id, ordem
)
INSERT INTO pdm_monitoramento_bloco_config
    (fase_id, ordem, habilitado, rotulo, criado_por, criado_em)
SELECT f.id, b.ordem, true, b.rotulo, -1, now()
FROM fases_novas f
JOIN (VALUES
    (1::smallint, 1::smallint, 'Informações complementares'),
    (2::smallint, 1::smallint, 'Detalhamento'),
    (2::smallint, 2::smallint, 'Ponto de atenção'),
    (4::smallint, 1::smallint, 'Comentário')
) AS b(fase_ordem, ordem, rotulo) ON b.fase_ordem = f.ordem;
