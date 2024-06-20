-- CreateTable
CREATE TABLE "projeto_tag" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "projeto_tag_pkey" PRIMARY KEY ("id")
);


-- AddForeignKey
ALTER TABLE "projeto_tag" ADD CONSTRAINT "projeto_tag_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_tag" ADD CONSTRAINT "projeto_tag_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_tag" ADD CONSTRAINT "projeto_tag_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "projeto_tag" ADD COLUMN     "tipo_projeto" "TipoProjeto" NOT NULL DEFAULT 'PP';
