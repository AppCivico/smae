-- AlterEnum
ALTER TYPE "FonteRelatorio" ADD VALUE 'PSIndicadores';

create unique index ix_uniq_global_analise_no_ciclo on variavel_global_ciclo_analise(variavel_id, referencia_data, fase)
    where removido_em is null and ultima_revisao = true;
