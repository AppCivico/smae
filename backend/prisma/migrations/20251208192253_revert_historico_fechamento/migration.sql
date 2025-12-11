/*
  Warnings:

  - You are about to drop the `meta_ciclo_fisico_fechamento_historico` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento_historico" DROP CONSTRAINT "meta_ciclo_fisico_fechamento_historico_fechamento_criado_p_fkey";

-- DropForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento_historico" DROP CONSTRAINT "meta_ciclo_fisico_fechamento_historico_meta_ciclo_fisico_f_fkey";

-- DropForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento_historico" DROP CONSTRAINT "meta_ciclo_fisico_fechamento_historico_reaberto_por_fkey";

-- DropTable
DROP TABLE "meta_ciclo_fisico_fechamento_historico";
