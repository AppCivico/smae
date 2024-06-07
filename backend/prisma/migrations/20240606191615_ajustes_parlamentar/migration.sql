-- AlterTable
ALTER TABLE "parlamentar" ADD COLUMN     "uf_nascimento" "ParlamentarUF",
ALTER COLUMN "atualizado_em" DROP NOT NULL;

-- AlterTable
ALTER TABLE "parlamentar_mandato" ADD COLUMN     "codigo_identificador" TEXT;
