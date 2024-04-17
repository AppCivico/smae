-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'refresh_transferencia';

-- CreateTable
CREATE TABLE "transferencia_status_consolidado" (
    "transferencia_id" INTEGER NOT NULL,
    "situacao" TEXT NOT NULL,
    "orgaos_envolvidos" INTEGER[],
    "data" DATE,
    "data_origem" TEXT NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transferencia_status_consolidado_pkey" PRIMARY KEY ("transferencia_id")
);

-- AddForeignKey
ALTER TABLE "transferencia_status_consolidado" ADD CONSTRAINT "transferencia_status_consolidado_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "transferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
