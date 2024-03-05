-- AlterTable
ALTER TABLE "grupo_painel_externo" ADD COLUMN     "modulo_sistema" "ModuloSistema" NOT NULL DEFAULT 'SMAE';

-- AlterTable
ALTER TABLE "painel_externo" ADD COLUMN     "modulo_sistema" "ModuloSistema" NOT NULL DEFAULT 'SMAE';
