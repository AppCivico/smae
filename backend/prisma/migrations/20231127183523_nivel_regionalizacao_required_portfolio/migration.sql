/*
  Warnings:

  - Made the column `nivel_regionalizacao` on table `portfolio` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "portfolio" ALTER COLUMN "nivel_regionalizacao" SET NOT NULL;
