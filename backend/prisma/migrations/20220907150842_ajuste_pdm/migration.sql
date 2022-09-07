-- AlterTable
ALTER TABLE "pdm" ADD COLUMN     "possui_complementacao_meta" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "possui_contexto_meta" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "possui_macro_tema" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "possui_sub_tema" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "possui_tema" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rotulo_complementacao_meta" TEXT NOT NULL DEFAULT 'Complementação',
ADD COLUMN     "rotulo_contexto_meta" TEXT NOT NULL DEFAULT 'Contexto',
ADD COLUMN     "rotulo_macro_tema" TEXT NOT NULL DEFAULT 'Macro Tema',
ADD COLUMN     "rotulo_sub_tema" TEXT NOT NULL DEFAULT 'Sub Tema',
ADD COLUMN     "rotulo_tema" TEXT NOT NULL DEFAULT 'Tema';

-- CreateTable
CREATE TABLE "subtema" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "subtema_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "subtema" ADD CONSTRAINT "subtema_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtema" ADD CONSTRAINT "subtema_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtema" ADD CONSTRAINT "subtema_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtema" ADD CONSTRAINT "subtema_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
