-- AlterTable
ALTER TABLE "projeto_fonte_recurso" ADD COLUMN     "valor_percentual_bkp" DOUBLE PRECISION,
ADD COLUMN     "observacao" TEXT;

UPDATE projeto_fonte_recurso SET valor_percentual_bkp = valor_percentual WHERE valor_percentual IS NOT NULL;

ALTER TABLE projeto_fonte_recurso DROP CONSTRAINT projeto_fonte_recurso_check;
ALTER TABLE projeto_fonte_recurso ADD CONSTRAINT projeto_fonte_recurso_check
    CHECK (valor_nominal IS NOT NULL OR valor_percentual_bkp IS NOT NULL);
