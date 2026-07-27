-- CreateTable
CREATE TABLE "relatorio_modelo" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(250) NOT NULL,
    "descricao" VARCHAR(1000),
    "fonte" "FonteRelatorio" NOT NULL,
    "sistema" "ModuloSistema" NOT NULL,
    "config" JSON NOT NULL,
    "visibilidade_tipo" VARCHAR(40),
    "orgao_id" INTEGER,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "relatorio_modelo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "relatorio_modelo_fonte_removido_em_idx" ON "relatorio_modelo"("fonte", "removido_em");

-- AlterTable: registra qual modelo produziu a saída desta execução (NULL = saída padrão).
ALTER TABLE "relatorio" ADD COLUMN "modelo_id" INTEGER;

-- AddForeignKey
ALTER TABLE "relatorio_modelo" ADD CONSTRAINT "relatorio_modelo_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio_modelo" ADD CONSTRAINT "relatorio_modelo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio_modelo" ADD CONSTRAINT "relatorio_modelo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio_modelo" ADD CONSTRAINT "relatorio_modelo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "relatorio_modelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: unicidade de nome por fonte apenas entre os modelos ativos. Índice parcial escrito à
-- mão porque o Prisma não expressa `WHERE removido_em IS NULL` no `@@unique` do schema — ele fica
-- documentado no comentário do model `RelatorioModelo`.
CREATE UNIQUE INDEX "relatorio_modelo_nome_fonte_unico"
    ON "relatorio_modelo"("nome", "fonte")
    WHERE "removido_em" IS NULL;
