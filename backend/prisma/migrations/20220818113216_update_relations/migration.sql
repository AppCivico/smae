-- AlterTable
ALTER TABLE "emaildb_config" ALTER COLUMN "delete_after" SET DEFAULT '10 year'::interval;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_divisao_tecnica_id_fkey" FOREIGN KEY ("divisao_tecnica_id") REFERENCES "divisao_tecnica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_coordenadoria_id_fkey" FOREIGN KEY ("coordenadoria_id") REFERENCES "coordenadoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
