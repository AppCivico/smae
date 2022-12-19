
-- AlterTable
ALTER TABLE "orcamento_realizado_item" ADD COLUMN     "data_referencia" DATE;


update orcamento_realizado_item me set data_referencia =
((select ano_referencia from orcamento_realizado x where x.id = me.orcamento_realizado_id)::text
|| '-' || me.mes || '-01')::date ;

ALTER TABLE "orcamento_realizado_item" alter COLUMN     "data_referencia" set not null;