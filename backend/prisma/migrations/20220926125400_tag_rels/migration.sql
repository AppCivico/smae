/*
  Warnings:

  - You are about to drop the column `iniciativa_id` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `meta_id` on the `tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tag" DROP CONSTRAINT "tag_iniciativa_id_fkey";

-- DropForeignKey
ALTER TABLE "tag" DROP CONSTRAINT "tag_meta_id_fkey";

-- AlterTable
ALTER TABLE "tag" DROP COLUMN "iniciativa_id",
DROP COLUMN "meta_id";

-- CreateTable
CREATE TABLE "meta_tag" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "meta_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iniciativa_tag" (
    "id" SERIAL NOT NULL,
    "iniciativa_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "iniciativa_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividade_tag" (
    "id" SERIAL NOT NULL,
    "atividade_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "atividade_tag_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "meta_tag" ADD CONSTRAINT "meta_tag_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_tag" ADD CONSTRAINT "meta_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iniciativa_tag" ADD CONSTRAINT "iniciativa_tag_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iniciativa_tag" ADD CONSTRAINT "iniciativa_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_tag" ADD CONSTRAINT "atividade_tag_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_tag" ADD CONSTRAINT "atividade_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
