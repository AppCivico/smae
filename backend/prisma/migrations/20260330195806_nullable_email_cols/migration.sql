-- DropIndex
DROP INDEX "demanda_email_parlamentar_vetores_busca_idx";

-- AlterTable
ALTER TABLE "demanda_email_parlamentar" ALTER COLUMN "assunto" DROP NOT NULL,
ALTER COLUMN "corpo" DROP NOT NULL;

-- RenameForeignKey
ALTER TABLE "demanda_email_parlamentar_item" RENAME CONSTRAINT "demanda_email_parlamentar_item_demanda_email_parlamentar_id_fke" TO "demanda_email_parlamentar_item_demanda_email_parlamentar_i_fkey";
