-- AlterTable
ALTER TABLE "acompanhamento_tipo" ADD COLUMN     "tipo_projeto" "TipoProjeto" NOT NULL DEFAULT 'PP';

-- AlterTable
ALTER TABLE "grupo_tematico" ADD COLUMN     "familias_beneficiadas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "programa_habitacional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unidades_habitacionais" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projeto_acompanhamento" ADD COLUMN     "apresentar_no_relatorio" BOOLEAN;
