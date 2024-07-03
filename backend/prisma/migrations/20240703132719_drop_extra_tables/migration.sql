/*
  Warnings:

  - You are about to drop the `projeto_equipamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projeto_grupo_tematico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projeto_tipo_intervencao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "projeto_equipamento" DROP CONSTRAINT "projeto_equipamento_equipamento_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_equipamento" DROP CONSTRAINT "projeto_equipamento_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_grupo_tematico" DROP CONSTRAINT "projeto_grupo_tematico_grupo_tematico_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_grupo_tematico" DROP CONSTRAINT "projeto_grupo_tematico_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_tipo_intervencao" DROP CONSTRAINT "projeto_tipo_intervencao_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_tipo_intervencao" DROP CONSTRAINT "projeto_tipo_intervencao_tipo_intervencao_id_fkey";

-- DropTable
DROP TABLE "projeto_equipamento";

-- DropTable
DROP TABLE "projeto_grupo_tematico";

-- DropTable
DROP TABLE "projeto_tipo_intervencao";
