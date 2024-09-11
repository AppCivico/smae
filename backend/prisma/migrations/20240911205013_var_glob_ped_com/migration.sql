-- AlterTable
ALTER TABLE "variavel_ciclo_corrente" ADD COLUMN     "pedido_complementacao" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "variavel_global_pedido_complementacao" (
    "id" SERIAL NOT NULL,
    "referencia_data" DATE NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "pedido" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "atendido" BOOLEAN NOT NULL,
    "atendido_em" TIMESTAMP(3),
    "atendido_por" INTEGER,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "variavel_global_pedido_complementacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variavel_global_pedido_complementacao_variavel_id_ultima_re_idx" ON "variavel_global_pedido_complementacao"("variavel_id", "ultima_revisao");

-- AddForeignKey
ALTER TABLE "variavel_global_pedido_complementacao" ADD CONSTRAINT "variavel_global_pedido_complementacao_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_pedido_complementacao" ADD CONSTRAINT "variavel_global_pedido_complementacao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_pedido_complementacao" ADD CONSTRAINT "variavel_global_pedido_complementacao_atendido_por_fkey" FOREIGN KEY ("atendido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_pedido_complementacao" ADD CONSTRAINT "variavel_global_pedido_complementacao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION f_atualiza_variavel_ciclo_corrente(p_variavel_id int)
    RETURNS void
    AS $$
DECLARE
    v_record RECORD;
    v_last_valid_period date;
    v_current_date date := date_trunc('month', CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo');
    v_threshold_date date;
BEGIN
    SELECT
        id,
        periodicidade,
        atraso_meses,
        inicio_medicao INTO v_record
    FROM
        variavel
    WHERE
        id = p_variavel_id
        AND tipo = 'Global'
        AND variavel_mae_id IS NULL
        AND removido_em IS NULL;

    IF v_record IS NULL THEN
        RAISE NOTICE 'Variável com ID % não encontrada ou != global/mae', p_variavel_id;
        RETURN;
    END IF;

    SELECT
        ultimo_periodo_valido(v_record.periodicidade, v_record.atraso_meses) INTO v_last_valid_period;

    -- Calcula o período limite para a variável
    v_threshold_date := v_current_date -(v_record.atraso_meses || ' months')::interval - periodicidade_intervalo(v_record.periodicidade);

    -- Verifica se o último período válido é anterior à data limite
    IF v_last_valid_period < v_threshold_date THEN
        DELETE FROM variavel_ciclo_corrente
        WHERE variavel_id = v_record.id;
    ELSE
        INSERT INTO variavel_ciclo_corrente(variavel_id, ultimo_periodo_valido, fase, proximo_periodo_abertura)
        VALUES (
            v_record.id,
            v_last_valid_period,
            'Preenchimento',
            v_last_valid_period +(v_record.atraso_meses || ' months')::interval
    )
        ON CONFLICT (variavel_id)
            DO UPDATE SET
                ultimo_periodo_valido = EXCLUDED.ultimo_periodo_valido,
                proximo_periodo_abertura = EXCLUDED.proximo_periodo_abertura;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Falha ao atualizar variavel_ciclo_corrente para variável ID %', p_variavel_id;
        END IF;
    END IF;
END;
$$
LANGUAGE plpgsql;

select f_atualiza_variavel_ciclo_corrente (id) from variavel where tipo='Global' and variavel_mae_id is null;
