-- AlterTable
CREATE SEQUENCE relatorio_id_seq;
ALTER TABLE "relatorio" ALTER COLUMN "id" SET DEFAULT nextval('relatorio_id_seq');
ALTER SEQUENCE relatorio_id_seq OWNED BY "relatorio"."id";
