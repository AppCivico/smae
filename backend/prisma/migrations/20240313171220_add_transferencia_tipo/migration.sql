-- CreateEnum
CREATE TYPE "TransferenciaTipoCategoria" AS ENUM ('Discricionaria', 'Impositiva');

-- CreateEnum
CREATE TYPE "TransferenciaTipoEsfera" AS ENUM ('Federal', 'Estadual');

-- CreateTable
CREATE TABLE "transferencia_tipo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "TransferenciaTipoCategoria" NOT NULL,
    "esfera" "TransferenciaTipoEsfera" NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "transferencia_tipo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transferencia_tipo" ADD CONSTRAINT "transferencia_tipo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_tipo" ADD CONSTRAINT "transferencia_tipo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_tipo" ADD CONSTRAINT "transferencia_tipo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
