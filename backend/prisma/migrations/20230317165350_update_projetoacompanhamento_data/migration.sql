-- AlterTable
ALTER TABLE "projeto_acompanhamento" ADD COLUMN     "prazo_realizado" DATE,
ALTER COLUMN "participantes" DROP NOT NULL,
ALTER COLUMN "detalhamento" DROP NOT NULL,
ALTER COLUMN "encaminhamento" DROP NOT NULL,
ALTER COLUMN "prazo_encaminhamento" DROP NOT NULL,
ALTER COLUMN "responsavel" DROP NOT NULL,
ALTER COLUMN "observacao" DROP NOT NULL,
ALTER COLUMN "detalhamento_status" DROP NOT NULL,
ALTER COLUMN "pontos_atencao" DROP NOT NULL,
ALTER COLUMN "removido_em" DROP NOT NULL,
ALTER COLUMN "removido_por" DROP NOT NULL;
