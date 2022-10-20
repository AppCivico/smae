begin;

delete from ciclo_fases_base;

-- AlterTable
ALTER TABLE "ciclo_fases_base" DROP COLUMN "n_dias_antes_do_fim_do_mes",
ADD COLUMN     "duracao" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ciclo_fases_pdm_config" DROP COLUMN "n_dias_antes_do_fim_do_mes",
ADD COLUMN     "duracao" INTEGER NOT NULL;

CREATE UNIQUE INDEX "ciclo_fases_base_ciclo_fase_key" ON "ciclo_fases_base"("ciclo_fase");


insert into ciclo_fases_base (ciclo_fase, n_dias_do_inicio_mes, duracao)
values
('Coleta', 0, 5),
('Analise', 5, 5),
('Risco', 10, 5),
('Fechamento', 15, -1)
;

commit;
