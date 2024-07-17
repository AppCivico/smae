-- CreateTable
CREATE TABLE "empreendimento" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "empreendimento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "empreendimento" ADD CONSTRAINT "empreendimento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empreendimento" ADD CONSTRAINT "empreendimento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empreendimento" ADD CONSTRAINT "empreendimento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
