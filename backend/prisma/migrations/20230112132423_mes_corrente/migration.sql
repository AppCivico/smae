-- AlterTable
ALTER TABLE "orcamento_realizado_item" ADD COLUMN     "mes_corrente" BOOLEAN NOT NULL DEFAULT false;
update orcamento_realizado_item set mes_corrente=true where (orcamento_realizado_id, mes) in ( select orcamento_realizado_id, max(mes)  from orcamento_realizado_item a join orcamento_realizado b on orcamento_realizado_id = b.id where  sobrescrito_em is null and removido_em is null group by 1);
