/*
  Warnings:

  - Added the required column `identificador_nro` to the `transferencia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transferencia" ADD COLUMN     "identificador_nro" INTEGER;

UPDATE transferencia SET identificador_nro = split_part(identificador, '/', 1)::int;

ALTER TABLE transferencia ALTER COLUMN identificador_nro SET NOT NULL;
