-- CreateTable
CREATE TABLE "meta_monitoramento_fase" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "fase_config_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "fecha_ciclo" BOOLEAN NOT NULL DEFAULT false,
    "comentario_sistema" TEXT,
    "reaberto_em" TIMESTAMPTZ(6),
    "reaberto_por" INTEGER,
    "legado_tipo" VARCHAR(16),
    "legado_id" INTEGER,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "meta_monitoramento_fase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_monitoramento_fase_bloco" (
    "id" SERIAL NOT NULL,
    "revisao_id" INTEGER NOT NULL,
    "bloco_config_id" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,

    CONSTRAINT "meta_monitoramento_fase_bloco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_monitoramento_fase_tag" (
    "id" SERIAL NOT NULL,
    "revisao_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "meta_monitoramento_fase_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_monitoramento_fase_documento" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "fase_config_id" INTEGER NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "descricao" TEXT,
    "legado_id" INTEGER,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "meta_monitoramento_fase_documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meta_monitoramento_fase_meta_id_ciclo_fisico_id_idx" ON "meta_monitoramento_fase"("meta_id", "ciclo_fisico_id");

-- CreateIndex
CREATE INDEX "meta_monitoramento_fase_fase_config_id_idx" ON "meta_monitoramento_fase"("fase_config_id");

-- CreateIndex
CREATE INDEX "meta_monitoramento_fase_bloco_bloco_config_id_idx" ON "meta_monitoramento_fase_bloco"("bloco_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "meta_monitoramento_fase_bloco_revisao_id_bloco_config_id_key" ON "meta_monitoramento_fase_bloco"("revisao_id", "bloco_config_id");

-- CreateIndex
CREATE INDEX "meta_monitoramento_fase_tag_tag_id_idx" ON "meta_monitoramento_fase_tag"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "meta_monitoramento_fase_tag_revisao_id_tag_id_key" ON "meta_monitoramento_fase_tag"("revisao_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "meta_monitoramento_fase_documento_legado_id_key" ON "meta_monitoramento_fase_documento"("legado_id");

-- CreateIndex
CREATE INDEX "meta_monitoramento_fase_documento_meta_id_ciclo_fisico_id_idx" ON "meta_monitoramento_fase_documento"("meta_id", "ciclo_fisico_id");

-- CreateIndex
CREATE INDEX "meta_monitoramento_fase_documento_fase_config_id_idx" ON "meta_monitoramento_fase_documento"("fase_config_id");

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase" ADD CONSTRAINT "meta_monitoramento_fase_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase" ADD CONSTRAINT "meta_monitoramento_fase_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase" ADD CONSTRAINT "meta_monitoramento_fase_fase_config_id_fkey" FOREIGN KEY ("fase_config_id") REFERENCES "pdm_monitoramento_fase_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase" ADD CONSTRAINT "meta_monitoramento_fase_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase" ADD CONSTRAINT "meta_monitoramento_fase_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase" ADD CONSTRAINT "meta_monitoramento_fase_reaberto_por_fkey" FOREIGN KEY ("reaberto_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_bloco" ADD CONSTRAINT "meta_monitoramento_fase_bloco_revisao_id_fkey" FOREIGN KEY ("revisao_id") REFERENCES "meta_monitoramento_fase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_bloco" ADD CONSTRAINT "meta_monitoramento_fase_bloco_bloco_config_id_fkey" FOREIGN KEY ("bloco_config_id") REFERENCES "pdm_monitoramento_bloco_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_tag" ADD CONSTRAINT "meta_monitoramento_fase_tag_revisao_id_fkey" FOREIGN KEY ("revisao_id") REFERENCES "meta_monitoramento_fase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_tag" ADD CONSTRAINT "meta_monitoramento_fase_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_documento" ADD CONSTRAINT "meta_monitoramento_fase_documento_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_documento" ADD CONSTRAINT "meta_monitoramento_fase_documento_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_documento" ADD CONSTRAINT "meta_monitoramento_fase_documento_fase_config_id_fkey" FOREIGN KEY ("fase_config_id") REFERENCES "pdm_monitoramento_fase_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_documento" ADD CONSTRAINT "meta_monitoramento_fase_documento_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_documento" ADD CONSTRAINT "meta_monitoramento_fase_documento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_documento" ADD CONSTRAINT "meta_monitoramento_fase_documento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_monitoramento_fase_documento" ADD CONSTRAINT "meta_monitoramento_fase_documento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- índices parciais (o Prisma não representa no schema)
CREATE UNIQUE INDEX "meta_monitoramento_fase_ultima_revisao_uniq" ON "meta_monitoramento_fase"("meta_id", "ciclo_fisico_id", "fase_config_id") WHERE "ultima_revisao" AND "removido_em" IS NULL;

CREATE UNIQUE INDEX "meta_monitoramento_fase_fechamento_uniq" ON "meta_monitoramento_fase"("meta_id", "ciclo_fisico_id") WHERE "ultima_revisao" AND "fecha_ciclo" AND "reaberto_em" IS NULL AND "removido_em" IS NULL;

CREATE UNIQUE INDEX "meta_monitoramento_fase_legado_uniq" ON "meta_monitoramento_fase"("legado_tipo", "legado_id") WHERE "legado_id" IS NOT NULL;
