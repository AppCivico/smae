-- DropForeignKey
ALTER TABLE "tag" DROP CONSTRAINT "tag_pdm_id_fkey";

-- AlterTable
ALTER TABLE "tag" ADD COLUMN     "iniciativa_id" INTEGER,
ADD COLUMN     "meta_id" INTEGER,
ALTER COLUMN "pdm_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Manually add constraint
-- Prisma does not support constraints yet
-- https://www.prisma.io/docs/guides/database/advanced-database-tasks/data-validation/postgresql
ALTER TABLE "tag" ADD CONSTRAINT "tag_one_fk_required" CHECK (pdm_id IS NOT NULL OR iniciativa_id IS NOT NULL OR meta_id IS NOT NULL);