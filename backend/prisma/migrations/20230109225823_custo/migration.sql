
ALTER TABLE "meta_orcamento" ADD COLUMN "custo_previsto" double PRECISION;

update meta_orcamento set custo_previsto = custeio_previsto+investimento_previsto;

ALTER TABLE "meta_orcamento" DROP COLUMN "custeio_previsto",
DROP COLUMN "investimento_previsto";
ALTER TABLE "meta_orcamento" alter COLUMN "custo_previsto" set not null;
