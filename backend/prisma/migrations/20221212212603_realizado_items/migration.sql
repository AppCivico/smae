begin;


CREATE TABLE "orcamento_realizado_item" (
    "id" SERIAL NOT NULL,
    "valor_empenho" DOUBLE PRECISION NOT NULL,
    "valor_liquidado" DOUBLE PRECISION NOT NULL,
    "mes" INTEGER NOT NULL,
    "orcamento_realizado_id" INTEGER NOT NULL,

    CONSTRAINT "orcamento_realizado_item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orcamento_realizado_item" ADD CONSTRAINT "orcamento_realizado_item_orcamento_realizado_id_fkey" FOREIGN KEY ("orcamento_realizado_id") REFERENCES "orcamento_realizado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

insert into orcamento_realizado_item(valor_empenho, valor_liquidado,mes, orcamento_realizado_id)
select valor_empenhado, valor_liquidado, mes_utilizado, id from orcamento_realizado;

ALTER TABLE "orcamento_realizado"
ADD COLUMN     "soma_valor_empenho" DOUBLE PRECISION,
ADD COLUMN     "soma_valor_liquidado" DOUBLE PRECISION ;

update orcamento_realizado set
soma_valor_empenho  = valor_empenhado,
soma_valor_liquidado  = valor_liquidado;


ALTER TABLE "orcamento_realizado"
DROP COLUMN "valor_empenhado",
DROP COLUMN "valor_liquidado",
alter  COLUMN     "soma_valor_empenho" set not null,
alter  COLUMN     "soma_valor_liquidado" set not null
;



commit;
