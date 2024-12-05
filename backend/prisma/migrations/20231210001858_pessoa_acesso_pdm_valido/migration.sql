-- AlterTable

-- CreateTable
CREATE TABLE "pessoa_acesso_pdm_valido" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,

    CONSTRAINT "pessoa_acesso_pdm_valido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_acesso_pdm_valido_pessoa_id_key" ON "pessoa_acesso_pdm_valido"("pessoa_id");

-- CreateIndex
CREATE INDEX "pessoa_acesso_pdm_valido_pessoa_id_idx" ON "pessoa_acesso_pdm_valido"("pessoa_id");

-- AddForeignKey
 ALTER TABLE "pessoa_acesso_pdm_valido" ADD CONSTRAINT "pessoa_acesso_pdm_valido_pessoa_id_fkey"
 FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TRIGGER trg_variavel_responsavel_recalc_pessoa ON variavel_responsavel;

CREATE TRIGGER trg_variavel_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON variavel_responsavel
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

DROP FUNCTION f_trigger_recalc_acesso_pessoa();

CREATE OR REPLACE FUNCTION f_recalc_acesso_pessoas() RETURNS trigger AS $emp_stamp$
BEGIN
    DELETE FROM pessoa_acesso_pdm_valido;
    DELETE FROM pessoa_acesso_pdm;
    RETURN NULL;
END;
$emp_stamp$ LANGUAGE plpgsql;



ALTER TABLE "pessoa_acesso_pdm" DROP COLUMN "congelado";
