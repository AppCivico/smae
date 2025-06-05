/*
  Warnings:

  - The values [CasaCivilAtvPendentes] on the enum `FonteRelatorio` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
ALTER TYPE "FonteRelatorio" RENAME VALUE 'CasaCivilAtvPendentes' TO 'AtvPendentes';
COMMIT;
