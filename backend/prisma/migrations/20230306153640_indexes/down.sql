-- DropForeignKey
ALTER TABLE "projeto_numero_sequencial" DROP CONSTRAINT "projeto_numero_sequencial_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_numero_sequencial" DROP CONSTRAINT "projeto_numero_sequencial_portfolio_id_fkey";

-- DropIndex
DROP INDEX "portifolio_orgao_portifolio_id_idx";

-- DropIndex
DROP INDEX "projeto_registro_sei_projeto_id_idx";

-- DropIndex
DROP INDEX "projeto_removido_em_idx";

-- DropIndex
DROP INDEX "projeto_relatorio_fila_projeto_id_idx";

-- DropIndex
DROP INDEX "projeto_orgao_participante_projeto_id_idx";

-- DropIndex
DROP INDEX "projeto_premissa_projeto_id_idx";

-- DropIndex
DROP INDEX "projeto_restricao_projeto_id_idx";

-- DropIndex
DROP INDEX "projeto_licao_aprendida_projeto_id_idx";

-- DropIndex
DROP INDEX "projeto_fonte_recurso_projeto_id_idx";

-- DropIndex
DROP INDEX "projeto_documento_projeto_id_idx";

-- DropIndex
DROP INDEX "projeto_risco_projeto_id_idx";

-- DropIndex
DROP INDEX "risco_tarefa_tarefa_id_idx";

-- DropIndex
DROP INDEX "risco_tarefa_projeto_risco_id_idx";

-- DropIndex
DROP INDEX "plano_acao_risco_tarefa_id_idx";

-- DropTable
DROP TABLE "projeto_numero_sequencial";

