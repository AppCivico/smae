ALTER TYPE "DistribuicaoSolicitacaoStatus" ADD VALUE 'EmRegistro' BEFORE 'Pendente';

-- Commit para que o novo valor do enum fique disponível (PG exige isso).
COMMIT;
BEGIN;

ALTER TABLE "distribuicao_recurso_solicitacao_ajuste"
ALTER COLUMN "status" SET DEFAULT 'EmRegistro'::"DistribuicaoSolicitacaoStatus";
