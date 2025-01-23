-- AlterTable
ALTER TABLE "pessoa" ADD COLUMN     "modulos_permitidos" "ModuloSistema"[],
ADD COLUMN     "sobreescrever_modulos" BOOLEAN NOT NULL DEFAULT false;
