
-- DropIndex
DROP INDEX "pdm_orcamento_realizado_config_meta_id_ano_referencia_ultim_key";

-- AlterTable
ALTER TABLE "pdm_orcamento_realizado_config" ADD COLUMN     "orgao_id" INTEGER ;
-- CreateIndex
CREATE UNIQUE INDEX "pdm_orcamento_realizado_config_meta_id_ano_referencia_orgao_key" ON "pdm_orcamento_realizado_config"("meta_id", "ano_referencia", "orgao_id", "ultima_revisao");

create temp table tmp_ins as
select
    a.ano_referencia, a.meta_id, a.ultima_revisao, a.atualizado_em, a.atualizado_por, a.execucao_concluida,
    b.orgao_id
from pdm_orcamento_realizado_config a
join meta_orgao b on b.meta_id = a.meta_id and b.responsavel
;

delete from pdm_orcamento_realizado_config;
insert into pdm_orcamento_realizado_config(ano_referencia, meta_id, ultima_revisao,      atualizado_em, atualizado_por, execucao_concluida, orgao_id)
select * from tmp_ins;

ALTER TABLE "pdm_orcamento_realizado_config" alter      "orgao_id" set not null;

-- AddForeignKey
ALTER TABLE "pdm_orcamento_realizado_config" ADD CONSTRAINT "pdm_orcamento_realizado_config_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
