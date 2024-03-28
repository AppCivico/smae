-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'aviso_email';

-- AlterTable
ALTER TABLE "aviso_email" ADD COLUMN     "executou_em" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "executou_em_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ultimo_envio_em" TIMESTAMP(3);
