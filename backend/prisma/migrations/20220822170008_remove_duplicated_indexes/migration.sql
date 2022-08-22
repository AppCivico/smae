-- DropIndex
DROP INDEX "cargo_id_key";

-- DropIndex
DROP INDEX "coordenadoria_id_key";

-- DropIndex
DROP INDEX "departamento_id_key";

-- DropIndex
DROP INDEX "divisao_tecnica_id_key";

-- DropIndex
DROP INDEX "orgao_id_key";

-- DropIndex
DROP INDEX "perfil_acesso_id_key";

-- DropIndex
DROP INDEX "perfil_privilegio_id_key";

-- DropIndex
DROP INDEX "pessoa_id_key";

-- DropIndex
DROP INDEX "pessoa_fisica_id_key";

-- DropIndex
DROP INDEX "pessoa_sessao_ativa_id_key";

-- DropIndex
DROP INDEX "tipo_orgao_id_key";

-- AlterTable
ALTER TABLE "emaildb_config" ALTER COLUMN "from" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "emaildb_queue" ALTER COLUMN "template" SET DATA TYPE TEXT,
ALTER COLUMN "to" SET DATA TYPE TEXT,
ALTER COLUMN "subject" SET DATA TYPE TEXT,
ALTER COLUMN "errmsg" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "modulo" ALTER COLUMN "codigo" SET DATA TYPE TEXT,
ALTER COLUMN "descricao" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "perfil_acesso" ALTER COLUMN "nome" SET DATA TYPE TEXT,
ALTER COLUMN "descricao" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "privilegio" ALTER COLUMN "nome" SET DATA TYPE TEXT,
ALTER COLUMN "codigo" SET DATA TYPE TEXT;
