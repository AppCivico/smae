-- AlterEnum
ALTER TYPE "TransferenciaHistoricoAcao" ADD VALUE 'ReaberturaFaseWorkflow';

-- AlterTable
ALTER TABLE "transferencia_historico" ADD COLUMN     "dados_extra" JSONB NOT NULL DEFAULT '{}';
