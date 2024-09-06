
-- DropIndex
DROP INDEX "comunicado_transfere_gov_numero_ano_titulo_key";

delete from nota where tipo_nota_id = -2; -- Deletar notas de comunicados

TRUNCATE TABLE "comunicado_transfere_gov";

-- AlterTable
ALTER TABLE "comunicado_transfere_gov" DROP COLUMN "data",
ADD COLUMN     "publicado_em" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "comunicado_transfere_gov_tipo_numero_ano_titulo_key" ON "comunicado_transfere_gov"("tipo", "numero", "ano", "titulo");
