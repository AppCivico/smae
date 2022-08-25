-- AlterTable
CREATE SEQUENCE "ods_id_seq";
ALTER TABLE "ods" ALTER COLUMN "id" SET DEFAULT nextval('ods_id_seq');
ALTER SEQUENCE "ods_id_seq" OWNED BY "ods"."id";
