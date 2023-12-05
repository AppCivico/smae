/*
  Warnings:

  - You are about to drop the column `data` on the `arquivo` table. All the data in the column will be lost.
*/

-- AlterTable
ALTER TABLE "projeto_documento" ADD COLUMN     "data" TIMESTAMP(3);

UPDATE "projeto_documento" SET "data" = "arquivo"."data" FROM "arquivo" WHERE "arquivo".id = "projeto_documento"."arquivo_id";

-- AlterTable
ALTER TABLE "arquivo" DROP COLUMN "data";

