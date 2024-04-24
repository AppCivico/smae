-- DropIndex
DROP INDEX "nota_data_nota_status_idx";

-- DropIndex
DROP INDEX "nota_rever_em_idx";

-- AlterTable
ALTER TABLE "aviso_email" ADD COLUMN     "viewNotaComOrdemId" INTEGER;

-- AlterTable
ALTER TABLE "nota" ALTER COLUMN "data_nota" SET DATA TYPE DATE,
ALTER COLUMN "rever_em" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "nota_enderecamento" ADD COLUMN     "viewNotaComOrdemId" INTEGER;

-- AlterTable
ALTER TABLE "nota_enderecamento_resposta" ADD COLUMN     "viewNotaComOrdemId" INTEGER;

-- AlterTable
ALTER TABLE "nota_revisao" ADD COLUMN     "viewNotaComOrdemId" INTEGER;

-- CreateIndex
CREATE INDEX "nota_bloco_nota_id_idx" ON "nota"("bloco_nota_id");

create or replace view view_notas as
SELECT
    id,
    bloco_nota_id,
    tipo_nota_id,
    data_nota,
    orgao_responsavel_id,
    pessoa_responsavel_id,
    nota,
    rever_em,
    dispara_email,
    status,
    n_encaminhamentos AS n_enderecamentos,
    n_repostas,
    ultima_resposta,
    criado_por,
    criado_em,
    removido_por,
    removido_em,

    CASE
        WHEN data_nota <= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + '1 day'::interval AND rever_em IS NOT NULL THEN rever_em
        ELSE data_nota
    END AS data_ordenacao
FROM nota;
