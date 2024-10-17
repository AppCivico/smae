-- AlterTable
ALTER TABLE "distribuicao_recurso_sei" ADD COLUMN     "status_sei_id" INTEGER;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_sei" ADD CONSTRAINT "distribuicao_recurso_sei_status_sei_id_fkey" FOREIGN KEY ("status_sei_id") REFERENCES "status_sei"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "distribuicao_recurso_sei" SET "status_sei_id" = (SELECT "id" FROM "status_sei" WHERE "processo_sei" = "distribuicao_recurso_sei"."processo_sei");