/*
  Warnings:

  - Made the column `descricao` on table `cargo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `descricao` on table `coordenadoria` required. This step will fail if there are existing NULL values in that column.
  - Made the column `descricao` on table `departamento` required. This step will fail if there are existing NULL values in that column.
  - Made the column `descricao` on table `divisao_tecnica` required. This step will fail if there are existing NULL values in that column.
  - Made the column `descricao` on table `orgao` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "cargo" ALTER COLUMN "descricao" SET NOT NULL;

-- AlterTable
ALTER TABLE "coordenadoria" ALTER COLUMN "descricao" SET NOT NULL;

-- AlterTable
ALTER TABLE "departamento" ALTER COLUMN "descricao" SET NOT NULL;

-- AlterTable
ALTER TABLE "divisao_tecnica" ALTER COLUMN "descricao" SET NOT NULL;

-- AlterTable
ALTER TABLE "orgao" ALTER COLUMN "descricao" SET NOT NULL;
