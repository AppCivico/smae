-- CreateEnum
CREATE TYPE "TipoVariavel" AS ENUM ('PDM', 'Global', 'Composta');

-- CreateEnum
CREATE TYPE "PerfilResponsavelVariavel" AS ENUM ('Medicao', 'Validacao', 'Liberacao');

-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "dado_aberto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "fonte_id" INTEGER,
ADD COLUMN     "metodologia" TEXT,
ADD COLUMN     "nivel_regionalizacao" INTEGER,
ADD COLUMN     "orgao_proprietario_id" INTEGER,
ADD COLUMN     "periodo_liberacao" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
ADD COLUMN     "periodo_preenchimento" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
ADD COLUMN     "periodo_validacao" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
ADD COLUMN     "tipo" "TipoVariavel" NOT NULL DEFAULT 'PDM';

-- CreateTable
CREATE TABLE "fonte_variavel" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "fonte_variavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_responsavel_variavel" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "perfil" "PerfilResponsavelVariavel" NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "grupo_responsavel_variavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_responsavel_variavel_pessoa" (
    "id" SERIAL NOT NULL,
    "grupo_responsavel_variavel_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "grupo_responsavel_variavel_pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variavel_grupo_responsavel_variavel" (
    "id" SERIAL NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "grupo_responsavel_variavel_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "variavel_grupo_responsavel_variavel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_orgao_proprietario_id_fkey" FOREIGN KEY ("orgao_proprietario_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_fonte_id_fkey" FOREIGN KEY ("fonte_id") REFERENCES "fonte_variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_responsavel_variavel_pessoa" ADD CONSTRAINT "grupo_responsavel_variavel_pessoa_grupo_responsavel_variav_fkey" FOREIGN KEY ("grupo_responsavel_variavel_id") REFERENCES "grupo_responsavel_variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_responsavel_variavel_pessoa" ADD CONSTRAINT "grupo_responsavel_variavel_pessoa_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_grupo_responsavel_variavel" ADD CONSTRAINT "variavel_grupo_responsavel_variavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_grupo_responsavel_variavel" ADD CONSTRAINT "variavel_grupo_responsavel_variavel_grupo_responsavel_vari_fkey" FOREIGN KEY ("grupo_responsavel_variavel_id") REFERENCES "grupo_responsavel_variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
