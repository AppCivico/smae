-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "polaridade" "Polaridade" NOT NULL DEFAULT 'Neutra';

-- CreateTable
CREATE TABLE "variavel_numero_sequencial" (
    "id" SERIAL NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "sequencial" INTEGER NOT NULL,

    CONSTRAINT "variavel_numero_sequencial_pkey" PRIMARY KEY ("id")
);

UPDATE variavel
SET polaridade = COALESCE(
    (select i.polaridade
    from indicador i
    join mv_variavel_pdm mv on mv.indicador_id = i.id
    where mv.variavel_id = variavel.id
    limit 1 --, nao é necessário limitar ainda (pdm), mas é bom para garantir que só vai pegar da crash em prod
    ),
 polaridade);
