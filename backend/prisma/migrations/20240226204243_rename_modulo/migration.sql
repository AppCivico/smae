-- CreateEnum
CREATE TYPE "ModuloSistema" AS ENUM ('SMAE', 'PDM', 'CasaCivil', 'Projetos');

-- AlterTable
ALTER TABLE "perfil_acesso" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "atualizado_por" INTEGER,
ADD COLUMN     "autogerenciavel" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criado_por" INTEGER,
ADD COLUMN     "removido_em" TIMESTAMPTZ(6),
ADD COLUMN     "removido_por" INTEGER;


alter TABLE "modulo" rename to   "privilegio_modulo"  ;

-- DropForeignKey
--ALTER TABLE "privilegio" DROP CONSTRAINT "privilegio_modulo_id_fkey";
--
--ALTER TABLE "privilegio" ADD CONSTRAINT "privilegio_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "privilegio_modulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "perfil_acesso"  ADD COLUMN "modulos_sistemas" "ModuloSistema"[] DEFAULT '{SMAE}'::"ModuloSistema"[];

-- AlterTable
ALTER TABLE "privilegio_modulo" RENAME CONSTRAINT "modulo_pkey" TO "privilegio_modulo_pkey";
ALTER TABLE  "privilegio_modulo" ADD COLUMN "modulo_sistema" "ModuloSistema" NOT NULL DEFAULT 'SMAE';

-- AddForeignKey
ALTER TABLE "perfil_acesso" ADD CONSTRAINT "perfil_acesso_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_acesso" ADD CONSTRAINT "perfil_acesso_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_acesso" ADD CONSTRAINT "perfil_acesso_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "modulo_codigo_key" RENAME TO "privilegio_modulo_codigo_key";

