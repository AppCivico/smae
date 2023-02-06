-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_suspenso_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_restaurado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_validado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_finalizou_planejamento_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_cancelado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_reiniciado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_iniciado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_terminado_por_fkey";

-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "finalizou_planejamento_em",
DROP COLUMN "finalizou_planejamento_por",
DROP COLUMN "restaurado_em",
DROP COLUMN "restaurado_por",
DROP COLUMN "terminado_em",
DROP COLUMN "terminado_por",
DROP COLUMN "validado_em",
DROP COLUMN "validado_por",
ADD COLUMN     "fechado_em" TIMESTAMP(3),
ADD COLUMN     "fechado_por" INTEGER;

