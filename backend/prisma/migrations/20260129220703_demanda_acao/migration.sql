-- CreateTable
CREATE TABLE "area_tematica" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "area_tematica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acao" (
    "id" SERIAL NOT NULL,
    "area_tematica_id" INTEGER NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "acao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "area_tematica" ADD CONSTRAINT "area_tematica_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_tematica" ADD CONSTRAINT "area_tematica_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_tematica" ADD CONSTRAINT "area_tematica_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acao" ADD CONSTRAINT "acao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acao" ADD CONSTRAINT "acao_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acao" ADD CONSTRAINT "acao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acao" ADD CONSTRAINT "acao_area_tematica_id_fkey" FOREIGN KEY ("area_tematica_id") REFERENCES "area_tematica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex (Partial Unique Indexes)
CREATE UNIQUE INDEX "area_tematica_nome_unico" ON "area_tematica"("nome") WHERE "removido_em" IS NULL;
CREATE UNIQUE INDEX "acao_nome_unico_por_area" ON "acao"("area_tematica_id", "nome") WHERE "removido_em" IS NULL;
