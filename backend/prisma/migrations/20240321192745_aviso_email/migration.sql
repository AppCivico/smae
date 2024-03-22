-- CreateEnum
CREATE TYPE "TipoAviso" AS ENUM ('CronogramaTerminoPlanejado');

-- CreateEnum
CREATE TYPE "AvisoPeriodo" AS ENUM ('Dias', 'Semanas', 'Meses', 'Anos');

-- CreateTable
CREATE TABLE "aviso_email" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoAviso" NOT NULL,
    "tarefa_cronograma_id" INTEGER,
    "tarefa_id" INTEGER,
    "com_copia" TEXT[],
    "numero" INTEGER NOT NULL,
    "numero_periodo" "AvisoPeriodo" NOT NULL,
    "recorrencia_dias" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "aviso_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aviso_email_disparos" (
    "id" SERIAL NOT NULL,
    "para" TEXT NOT NULL,
    "com_copia" TEXT[],
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aviso_email_id" INTEGER NOT NULL,
    "emaildb_queue_id" UUID NOT NULL,

    CONSTRAINT "aviso_email_disparos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "aviso_email" ADD CONSTRAINT "aviso_email_tarefa_cronograma_id_fkey" FOREIGN KEY ("tarefa_cronograma_id") REFERENCES "tarefa_cronograma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso_email" ADD CONSTRAINT "aviso_email_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "tarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso_email_disparos" ADD CONSTRAINT "aviso_email_disparos_id_fkey" FOREIGN KEY ("id") REFERENCES "aviso_email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso_email_disparos" ADD CONSTRAINT "aviso_email_disparos_emaildb_queue_id_fkey" FOREIGN KEY ("emaildb_queue_id") REFERENCES "emaildb_queue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION f_tgr_update_ano_projeto_tarefa_trigger()
    RETURNS TRIGGER
    AS $$
DECLARE
 tmp INTEGER;
BEGIN

    SELECT projeto_id into tmp
    from tarefa_cronograma
    where id = NEW.tarefa_cronograma_id;

    if (tmp is not null) then
        PERFORM atualiza_ano_orcamento_projeto(tmp);
    end if;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_tgr_update_ano_projeto_trigger()
    RETURNS TRIGGER
    AS $$
DECLARE
 tmp INTEGER;
BEGIN
    PERFORM atualiza_ano_orcamento_projeto(NEW.projeto_id);

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER tgr_ano_orcamento_projeto_tarefa on tarefa;

CREATE TRIGGER tgr_ano_orcamento_projeto_tarefa
AFTER INSERT OR UPDATE
ON tarefa
FOR EACH ROW
EXECUTE FUNCTION f_tgr_update_ano_projeto_tarefa_trigger();
