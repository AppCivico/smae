-- AlterTable
ALTER TABLE "etapa" ADD COLUMN     "variavel_id" INTEGER;

-- AddForeignKey
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE PROCEDURE proc_sync_serie_variavel(
    pVariavelId INT,
    pSerie "Serie",
    pData DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_added BOOLEAN;
    valor_nominal DECIMAL;
    currentDate DATE;
    v_record RECORD;

    v_cat_sim INT;
    v_cat_nao INT;
    v_cat_id INT;

    _debug VARCHAR;

    v_acumulativa BOOLEAN; -- em teoria sempre é, mas just in case
    v_variavel_categorica_valor_id INT;

BEGIN

    SELECT
        v.variavel_categorica_id,
        vs.id,
        vn.id,
        v.acumulativa
    INTO
        v_cat_id,
        v_cat_sim,
        v_cat_nao,
        v_acumulativa
    FROM variavel v
    JOIN variavel_categorica_valor vs on v.variavel_categorica_id = vs.variavel_categorica_id and vs.valor_variavel = 1
    JOIN variavel_categorica_valor vn on v.variavel_categorica_id = vn.variavel_categorica_id and vn.valor_variavel = 0
    WHERE v.id = pVariavelId;

    IF (v_cat_id IS NULL) THEN
        RAISE EXCEPTION 'Variavel id % não é categórica', pVariavelId;
    END IF;

    -- Delete tudo para a serie
    DELETE FROM serie_variavel
    WHERE variavel_id = pVariavelId
    AND serie = pSerie;

    v_added := FALSE;
    -- pega min/max e o periodo

    FOR v_record IN
        SELECT * FROM busca_periodos_variavel(pVariavelId)
    LOOP
        --raise notice 'v_record: %', v_record;

        currentDate := v_record.min;

        WHILE currentDate <= v_record.max LOOP

            IF currentDate < date_trunc('month', pData) THEN
                valor_nominal := 0;
                v_variavel_categorica_valor_id := v_cat_nao;
            ELSIF currentDate >= date_trunc('month', pData) AND v_added = FALSE THEN
                valor_nominal := 1;
                v_variavel_categorica_valor_id := v_cat_sim;
                v_added := true;
            ELSIF currentDate <= date_trunc('month', CURRENT_DATE)  THEN
                valor_nominal := 0;
                v_variavel_categorica_valor_id := v_cat_nao;
            ELSE
                EXIT;
            END IF;

            INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal, variavel_categorica_valor_id, variavel_categorica_id)
            VALUES (pVariavelId, pSerie, currentDate, valor_nominal, v_variavel_categorica_valor_id, v_cat_id);

            currentDate := currentDate + v_record.periodicidade;
        END LOOP;
    END LOOP;

    IF (v_acumulativa) THEN

        select monta_serie_acumulada(pVariavelId, pSerie = 'Realizado'::"Serie") into _debug;

    END IF;

    FOR v_record IN
        SELECT indicador_id FROM mv_variavel_pdm WHERE variavel_id = pVariavelId
    LOOP
        SELECT refresh_serie_indicador(v_record.indicador_id, '{}'::jsonb) into _debug;
    END LOOP;

END;
$$;

CREATE OR REPLACE FUNCTION f_tgr_atualiza_variavel_na_troca_da_etapa()
RETURNS TRIGGER AS $$
DECLARE
    v_inserida_agora BOOLEAN;
BEGIN
    -- Inicializa a flag que indica se uma variável foi associada à etapa nesta operação
    v_inserida_agora := false;

    -- Verifica a operação realizada na tabela etapa
    IF TG_OP = 'INSERT' THEN
        -- Se for uma inserção, não permite associar variável
        IF NEW.variavel_id IS NOT NULL THEN
            RAISE EXCEPTION 'Não é possível associar uma variável a uma etapa no momento da criação da etapa';
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN

        -- Se for uma atualização, verifica se a variável associada foi alterada
        IF OLD.variavel_id IS DISTINCT FROM NEW.variavel_id OR OLD.removido_em IS DISTINCT FROM NEW.removido_em THEN
            -- Se a variável foi removida (definida como NULL)
            -- ou tbm se a etapa foi removida
            -- se fizer o restore, vai precisar voltar manualmente a variavel
            IF NEW.variavel_id IS NULL OR NEW.removido_em IS NOT NULL THEN
                -- Define a variável como removida
                UPDATE variavel
                SET removido_em = NOW()
                WHERE id = OLD.variavel_id AND removido_em IS NULL;

            -- Se uma nova variável foi associada
            ELSE
                -- Atualiza a região da variável, se necessário
                UPDATE variavel
                SET regiao_id = NEW.regiao_id
                WHERE id = NEW.variavel_id AND regiao_id IS DISTINCT FROM NEW.regiao_id;

                -- Verifica se a variável já está associada a outra etapa
                IF EXISTS (
                    SELECT 1
                    FROM variavel v
                    JOIN etapa e ON e.variavel_id = v.id
                    WHERE v.id = NEW.variavel_id
                    AND e.removido_em IS NULL
                    AND e.id <> NEW.id
                ) THEN
                    RAISE EXCEPTION 'A variável já está associada a outra etapa';
                END IF;

                -- Sincroniza as séries da variável com base nas datas da etapa
                CALL proc_sync_serie_variavel(NEW.variavel_id, 'Previsto'::"Serie", NEW.termino_previsto);
                CALL proc_sync_serie_variavel(NEW.variavel_id, 'Realizado'::"Serie", NEW.termino_real);

                v_inserida_agora := true;
            END IF;

        -- Se a região da etapa foi alterada
        ELSIF OLD.regiao_id IS DISTINCT FROM NEW.regiao_id THEN
            -- Atualiza a região da variável
            UPDATE variavel
            SET regiao_id = NEW.regiao_id
            WHERE id = NEW.variavel_id;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        -- Se havia uma variável associada à etapa, não deveria apagar dessa forma, though
        IF OLD.variavel_id IS NOT NULL THEN
            -- Define a variável como removida
            UPDATE variavel
            SET removido_em = NOW()
            WHERE id = OLD.variavel_id AND removido_em IS NULL;
        END IF;
    END IF;

    -- Se for uma atualização e uma nova variável NÃO foi associada nesta operação
    IF TG_OP = 'UPDATE' AND v_inserida_agora = FALSE AND NEW.variavel_id IS NOT NULL THEN
        -- Se a data de término prevista foi alterada
        IF OLD.termino_previsto IS DISTINCT FROM NEW.termino_previsto THEN
            CALL proc_sync_serie_variavel(NEW.variavel_id, 'Previsto'::"Serie", NEW.termino_previsto);
        END IF;

        -- Se a data de término real foi alterada
        IF OLD.termino_real IS DISTINCT FROM NEW.termino_real THEN
            CALL proc_sync_serie_variavel(NEW.variavel_id, 'Realizado'::"Serie", NEW.termino_real);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER etapa_update_variavel
BEFORE INSERT OR UPDATE OR DELETE ON etapa
FOR EACH ROW
EXECUTE PROCEDURE f_tgr_atualiza_variavel_na_troca_da_etapa();

create or replace view view_etapa_rel_meta_indicador AS
select
    v.*,
    ia.id as indicador_id
from view_etapa_rel_meta v
join indicador ia on ia.atividade_id = v.atividade_id or ia.iniciativa_id = v.iniciativa_id or ia.meta_id = v.meta_id;
