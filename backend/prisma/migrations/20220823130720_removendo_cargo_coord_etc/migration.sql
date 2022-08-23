/*
  Warnings:

  - You are about to drop the column `cargo_id` on the `pessoa_fisica` table. All the data in the column will be lost.
  - You are about to drop the column `coordenadoria_id` on the `pessoa_fisica` table. All the data in the column will be lost.
  - You are about to drop the column `departamento_id` on the `pessoa_fisica` table. All the data in the column will be lost.
  - You are about to drop the column `divisao_tecnica_id` on the `pessoa_fisica` table. All the data in the column will be lost.
  - You are about to drop the `cargo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coordenadoria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `departamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `divisao_tecnica` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cargo" DROP CONSTRAINT "cargo_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "cargo" DROP CONSTRAINT "cargo_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "cargo" DROP CONSTRAINT "cargo_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "coordenadoria" DROP CONSTRAINT "coordenadoria_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "coordenadoria" DROP CONSTRAINT "coordenadoria_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "coordenadoria" DROP CONSTRAINT "coordenadoria_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "departamento" DROP CONSTRAINT "departamento_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "departamento" DROP CONSTRAINT "departamento_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "departamento" DROP CONSTRAINT "departamento_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "divisao_tecnica" DROP CONSTRAINT "divisao_tecnica_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "divisao_tecnica" DROP CONSTRAINT "divisao_tecnica_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "divisao_tecnica" DROP CONSTRAINT "divisao_tecnica_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "pessoa_fisica" DROP CONSTRAINT "pessoa_fisica_cargo_id_fkey";

-- DropForeignKey
ALTER TABLE "pessoa_fisica" DROP CONSTRAINT "pessoa_fisica_coordenadoria_id_fkey";

-- DropForeignKey
ALTER TABLE "pessoa_fisica" DROP CONSTRAINT "pessoa_fisica_departamento_id_fkey";

-- DropForeignKey
ALTER TABLE "pessoa_fisica" DROP CONSTRAINT "pessoa_fisica_divisao_tecnica_id_fkey";

-- AlterTable
ALTER TABLE "pessoa_fisica" DROP COLUMN "cargo_id",
DROP COLUMN "coordenadoria_id",
DROP COLUMN "departamento_id",
DROP COLUMN "divisao_tecnica_id",
ADD COLUMN     "locacao" TEXT;

-- DropTable
DROP TABLE "cargo";

-- DropTable
DROP TABLE "coordenadoria";

-- DropTable
DROP TABLE "departamento";

-- DropTable
DROP TABLE "divisao_tecnica";
