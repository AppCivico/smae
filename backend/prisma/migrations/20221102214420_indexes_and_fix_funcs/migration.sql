-- CreateIndex
CREATE INDEX "indicador_meta_id_idx" ON "indicador"("meta_id");

-- CreateIndex
CREATE INDEX "indicador_iniciativa_id_idx" ON "indicador"("iniciativa_id");

-- CreateIndex
CREATE INDEX "indicador_atividade_id_idx" ON "indicador"("atividade_id");

-- CreateIndex
CREATE INDEX "idx_indicador_variavel_variavel" ON "indicador_variavel"("variavel_id");

-- CreateIndex
CREATE INDEX "idx_indicador_variavel_indicador" ON "indicador_variavel"("indicador_id");

-- CreateIndex
CREATE INDEX "meta_pdm_id_idx" ON "meta"("pdm_id");

-- CreateIndex
CREATE INDEX "meta_responsavel_pessoa_id_idx" ON "meta_responsavel"("pessoa_id");

-- CreateIndex
CREATE INDEX "idx_indicador_indicador_id_data_valor" ON "serie_indicador"("indicador_id", "data_valor");

-- CreateIndex
CREATE INDEX "variavel_responsavel_pessoa_id_idx" ON "variavel_responsavel"("pessoa_id");

CREATE OR REPLACE FUNCTION busca_periodos_variavel (pVariavelId int)
    RETURNS TABLE (
        periodicidade interval,
        min date,
        max date
    )
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        min(periodicidade_intervalo (v.periodicidade)),
        coalesce(v.inicio_medicao, min(i.inicio_medicao)),
        coalesce(v.fim_medicao, max(i.fim_medicao))
    FROM
        variavel v
        JOIN indicador_variavel iv ON IV.variavel_id = v.id and iv.desativado_em is null
        JOIN indicador i ON Iv.indicador_id = i.id
    WHERE
        v.id = pVariavelId
    GROUP BY
        (v.fim_medicao, v.inicio_medicao);
END;
$$
LANGUAGE plpgsql;

