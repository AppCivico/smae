/*
  Warnings:

  - Added the required column `ano` to the `contrato_fonte_recurso` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contrato_fonte_recurso" ADD COLUMN     "ano" INTEGER NOT NULL;
