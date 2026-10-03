-- Resolve o plano da linha (meta/iniciativa/atividade/indicador/cronograma/etapa e tabelas *_responsavel,
-- indicador_variavel, cronograma_etapa, ciclo_fisico) e diz se ela pertence a um PDM legado (sistema = 'PDM').
-- Recebe a linha como jsonb para não depender das colunas de cada tabela. Na dúvida (pai não encontrado)
-- devolve true, para invalidar a mais e nunca a menos.
CREATE OR REPLACE FUNCTION f_acesso_pdm_linha_eh_legado(r jsonb)
    RETURNS boolean
    AS $$
DECLARE
    v_pdm_id integer;
    v_meta_id integer;
    v_iniciativa_id integer;
    v_atividade_id integer;
    v_cronograma_id integer;
BEGIN
    IF r IS NULL THEN
        RETURN false;
    END IF;

    IF r ? 'pdm_id' THEN
        v_pdm_id := (r->>'pdm_id')::int;
    ELSIF r ? 'variavel_id' AND NOT r ? 'indicador_id' THEN
        -- variavel_responsavel: só variável do tipo PDM entra no cálculo de acesso legado
        RETURN EXISTS (SELECT 1 FROM variavel WHERE id = (r->>'variavel_id')::int AND tipo = 'PDM');
    ELSE
        IF r ? 'cronograma_id' THEN
            v_cronograma_id := (r->>'cronograma_id')::int;
        ELSIF r ? 'etapa_id' THEN
            SELECT e.cronograma_id INTO v_cronograma_id FROM etapa e WHERE e.id = (r->>'etapa_id')::int;
        END IF;

        IF v_cronograma_id IS NOT NULL THEN
            SELECT c.meta_id, c.iniciativa_id, c.atividade_id INTO v_meta_id, v_iniciativa_id, v_atividade_id
            FROM cronograma c WHERE c.id = v_cronograma_id;
        ELSIF r ? 'indicador_id' THEN
            SELECT i.meta_id, i.iniciativa_id, i.atividade_id INTO v_meta_id, v_iniciativa_id, v_atividade_id
            FROM indicador i WHERE i.id = (r->>'indicador_id')::int;
        ELSE
            v_meta_id := (r->>'meta_id')::int;
            v_iniciativa_id := (r->>'iniciativa_id')::int;
            v_atividade_id := (r->>'atividade_id')::int;
        END IF;

        v_meta_id := COALESCE(
            v_meta_id,
            (SELECT i.meta_id FROM iniciativa i WHERE i.id = v_iniciativa_id),
            (SELECT i.meta_id FROM atividade a JOIN iniciativa i ON i.id = a.iniciativa_id WHERE a.id = v_atividade_id)
        );
        SELECT m.pdm_id INTO v_pdm_id FROM meta m WHERE m.id = v_meta_id;
    END IF;

    IF v_pdm_id IS NULL THEN
        RETURN true;
    END IF;

    RETURN EXISTS (SELECT 1 FROM pdm WHERE id = v_pdm_id AND sistema = 'PDM');
END;
$$
LANGUAGE plpgsql;

-- Limpa as tabelas de cache no fim da transação. Em Read Committed o DELETE enxerga tudo que já foi
-- commitado; em Repeatable Read/Serializable ele roda no snapshot do início da transação (não apaga
-- cache recalculado depois, e dá 40001 se outra transação apagou antes), então usa TRUNCATE, que limpa a
-- tabela inteira independente do snapshot.
CREATE OR REPLACE FUNCTION f_limpa_cache_pdm_tabela(p_tabela text)
    RETURNS void
    AS $$
BEGIN
    IF current_setting('transaction_isolation') = 'read committed' THEN
        EXECUTE format('DELETE FROM %I', p_tabela);
    ELSE
        EXECUTE format('TRUNCATE %I', p_tabela);
    END IF;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_recalc_acesso_pessoas_no_commit()
    RETURNS trigger
    AS $$
BEGIN
    IF current_setting('smae.acesso_pdm_limpo_tx', true) IS NOT DISTINCT FROM txid_current()::text THEN
        RETURN NULL;
    END IF;

    IF TG_TABLE_NAME = 'pdm' THEN
        IF NEW.sistema IS DISTINCT FROM 'PDM' AND OLD.sistema IS DISTINCT FROM 'PDM' THEN
            RETURN NULL;
        END IF;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM pdm WHERE sistema = 'PDM' AND removido_em IS NULL) THEN
            RETURN NULL;
        END IF;

        IF TG_TABLE_NAME = 'variavel' THEN
            -- IF aninhado: plpgsql resolve NEW.tipo ao planejar a expressão, sem curto-circuito
            IF NEW.tipo IS DISTINCT FROM 'PDM' AND OLD.tipo IS DISTINCT FROM 'PDM' THEN
                RETURN NULL;
            END IF;
        ELSIF TG_TABLE_NAME <> 'perfil_privilegio' THEN
            -- linha de PS / PdM novo não mexe no cache do PDM legado
            IF NOT (
                f_acesso_pdm_linha_eh_legado(CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END)
                OR f_acesso_pdm_linha_eh_legado(CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END)
            ) THEN
                RETURN NULL;
            END IF;
        END IF;
    END IF;

    PERFORM set_config('smae.acesso_pdm_limpo_tx', txid_current()::text, true);
    PERFORM f_limpa_cache_pdm_tabela('pessoa_acesso_pdm_valido');
    PERFORM f_limpa_cache_pdm_tabela('pessoa_acesso_pdm');
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_limpa_status_meta_ciclo_fisico()
    RETURNS trigger
    AS $$
BEGIN
    IF current_setting('smae.status_meta_limpo_tx', true) IS NOT DISTINCT FROM txid_current()::text THEN
        RETURN NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pdm WHERE sistema = 'PDM' AND removido_em IS NULL) THEN
        RETURN NULL;
    END IF;

    IF NOT (
        f_acesso_pdm_linha_eh_legado(CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END)
        OR f_acesso_pdm_linha_eh_legado(CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END)
    ) THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('smae.status_meta_limpo_tx', txid_current()::text, true);
    PERFORM f_limpa_cache_pdm_tabela('status_meta_ciclo_fisico');
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- triggers antigos (FOR EACH STATEMENT, imediatos e sem filtro de plano) substituídos pelos deferidos abaixo
DROP TRIGGER IF EXISTS trg_ciclo_fisico_recalc_pessoa ON ciclo_fisico;
DROP TRIGGER IF EXISTS trg_iniciativa_responsavel_recalc_pessoa ON iniciativa;
DROP TRIGGER IF EXISTS trg_atividade_responsavel_recalc_pessoa ON atividade;
DROP TRIGGER IF EXISTS trg_variavel_responsavel_recalc_pessoa ON variavel_responsavel;
DROP TRIGGER IF EXISTS trg_indicador_recalc_pessoa ON indicador;
DROP TRIGGER IF EXISTS trg_etapa_responsavel_recalc_pessoa ON etapa_responsavel;

DROP TRIGGER IF EXISTS trg_meta_responsavel_recalc_acesso_pdm ON meta_responsavel;
CREATE CONSTRAINT TRIGGER trg_meta_responsavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON meta_responsavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_iniciativa_responsavel_recalc_acesso_pdm ON iniciativa_responsavel;
CREATE CONSTRAINT TRIGGER trg_iniciativa_responsavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON iniciativa_responsavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_atividade_responsavel_recalc_acesso_pdm ON atividade_responsavel;
CREATE CONSTRAINT TRIGGER trg_atividade_responsavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON atividade_responsavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_indicador_variavel_recalc_acesso_pdm ON indicador_variavel;
CREATE CONSTRAINT TRIGGER trg_indicador_variavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON indicador_variavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_perfil_privilegio_recalc_acesso_pdm ON perfil_privilegio;
CREATE CONSTRAINT TRIGGER trg_perfil_privilegio_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON perfil_privilegio
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

-- UPDATE separado do INSERT/DELETE para poder ter WHEN: o app manda colunas no SET mesmo sem alterar o valor
DROP TRIGGER IF EXISTS trg_meta_recalc_acesso_pdm ON meta;
CREATE CONSTRAINT TRIGGER trg_meta_recalc_acesso_pdm AFTER INSERT OR DELETE ON meta
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_meta_upd_recalc_acesso_pdm ON meta;
CREATE CONSTRAINT TRIGGER trg_meta_upd_recalc_acesso_pdm AFTER UPDATE OF pdm_id, ativo, removido_em ON meta
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD.pdm_id IS DISTINCT FROM NEW.pdm_id OR OLD.ativo IS DISTINCT FROM NEW.ativo OR OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_iniciativa_recalc_acesso_pdm ON iniciativa;
CREATE CONSTRAINT TRIGGER trg_iniciativa_recalc_acesso_pdm AFTER INSERT OR DELETE ON iniciativa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_iniciativa_upd_recalc_acesso_pdm ON iniciativa;
CREATE CONSTRAINT TRIGGER trg_iniciativa_upd_recalc_acesso_pdm AFTER UPDATE OF meta_id, removido_em ON iniciativa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD.meta_id IS DISTINCT FROM NEW.meta_id OR OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_atividade_recalc_acesso_pdm ON atividade;
CREATE CONSTRAINT TRIGGER trg_atividade_recalc_acesso_pdm AFTER INSERT OR DELETE ON atividade
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_atividade_upd_recalc_acesso_pdm ON atividade;
CREATE CONSTRAINT TRIGGER trg_atividade_upd_recalc_acesso_pdm AFTER UPDATE OF iniciativa_id, removido_em ON atividade
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD.iniciativa_id IS DISTINCT FROM NEW.iniciativa_id OR OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_indicador_recalc_acesso_pdm ON indicador;
CREATE CONSTRAINT TRIGGER trg_indicador_recalc_acesso_pdm AFTER INSERT OR DELETE ON indicador
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_indicador_upd_recalc_acesso_pdm ON indicador;
CREATE CONSTRAINT TRIGGER trg_indicador_upd_recalc_acesso_pdm AFTER UPDATE OF meta_id, iniciativa_id, atividade_id, removido_em ON indicador
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (
        OLD.meta_id IS DISTINCT FROM NEW.meta_id
        OR OLD.iniciativa_id IS DISTINCT FROM NEW.iniciativa_id
        OR OLD.atividade_id IS DISTINCT FROM NEW.atividade_id
        OR OLD.removido_em IS DISTINCT FROM NEW.removido_em
    )
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_ciclo_fisico_recalc_acesso_pdm ON ciclo_fisico;
CREATE CONSTRAINT TRIGGER trg_ciclo_fisico_recalc_acesso_pdm AFTER INSERT OR DELETE ON ciclo_fisico
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_ciclo_fisico_upd_recalc_acesso_pdm ON ciclo_fisico;
CREATE CONSTRAINT TRIGGER trg_ciclo_fisico_upd_recalc_acesso_pdm AFTER UPDATE ON ciclo_fisico
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_variavel_responsavel_recalc_acesso_pdm ON variavel_responsavel;
CREATE CONSTRAINT TRIGGER trg_variavel_responsavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON variavel_responsavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_etapa_responsavel_recalc_acesso_pdm ON etapa_responsavel;
CREATE CONSTRAINT TRIGGER trg_etapa_responsavel_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON etapa_responsavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_cronograma_recalc_acesso_pdm ON cronograma;
CREATE CONSTRAINT TRIGGER trg_cronograma_recalc_acesso_pdm AFTER INSERT OR DELETE ON cronograma
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_cronograma_upd_recalc_acesso_pdm ON cronograma;
CREATE CONSTRAINT TRIGGER trg_cronograma_upd_recalc_acesso_pdm AFTER UPDATE OF removido_em, meta_id, iniciativa_id, atividade_id ON cronograma
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (
        OLD.removido_em IS DISTINCT FROM NEW.removido_em
        OR OLD.meta_id IS DISTINCT FROM NEW.meta_id
        OR OLD.iniciativa_id IS DISTINCT FROM NEW.iniciativa_id
        OR OLD.atividade_id IS DISTINCT FROM NEW.atividade_id
    )
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_cronograma_etapa_recalc_acesso_pdm ON cronograma_etapa;
CREATE CONSTRAINT TRIGGER trg_cronograma_etapa_recalc_acesso_pdm AFTER INSERT OR DELETE ON cronograma_etapa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_cronograma_etapa_upd_recalc_acesso_pdm ON cronograma_etapa;
CREATE CONSTRAINT TRIGGER trg_cronograma_etapa_upd_recalc_acesso_pdm AFTER UPDATE OF inativo, cronograma_id, etapa_id ON cronograma_etapa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (
        OLD.inativo IS DISTINCT FROM NEW.inativo
        OR OLD.cronograma_id IS DISTINCT FROM NEW.cronograma_id
        OR OLD.etapa_id IS DISTINCT FROM NEW.etapa_id
    )
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_variavel_recalc_acesso_pdm ON variavel;
CREATE CONSTRAINT TRIGGER trg_variavel_recalc_acesso_pdm AFTER INSERT OR DELETE ON variavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_variavel_upd_recalc_acesso_pdm ON variavel;
CREATE CONSTRAINT TRIGGER trg_variavel_upd_recalc_acesso_pdm AFTER UPDATE OF tipo, atraso_meses, removido_em, mostrar_monitoramento, suspendida_em, periodicidade, inicio_medicao, fim_medicao ON variavel
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (
        (OLD.tipo, OLD.atraso_meses, OLD.removido_em, OLD.mostrar_monitoramento, OLD.suspendida_em, OLD.periodicidade, OLD.inicio_medicao, OLD.fim_medicao)
        IS DISTINCT FROM
        (NEW.tipo, NEW.atraso_meses, NEW.removido_em, NEW.mostrar_monitoramento, NEW.suspendida_em, NEW.periodicidade, NEW.inicio_medicao, NEW.fim_medicao)
    )
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

DROP TRIGGER IF EXISTS trg_pdm_recalc_acesso_pdm ON pdm;
CREATE CONSTRAINT TRIGGER trg_pdm_recalc_acesso_pdm AFTER UPDATE OF ativo, removido_em ON pdm
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD.ativo IS DISTINCT FROM NEW.ativo OR OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    EXECUTE FUNCTION f_recalc_acesso_pessoas_no_commit();

CREATE OR REPLACE FUNCTION f_invalida_acesso_pdm_pessoa_perfil()
    RETURNS trigger
    AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        DELETE FROM pessoa_acesso_pdm_valido WHERE pessoa_id = OLD.pessoa_id;
        DELETE FROM pessoa_acesso_pdm WHERE pessoa_id = OLD.pessoa_id;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        DELETE FROM pessoa_acesso_pdm_valido WHERE pessoa_id = NEW.pessoa_id;
        DELETE FROM pessoa_acesso_pdm WHERE pessoa_id = NEW.pessoa_id;
    END IF;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pessoa_perfil_recalc_acesso_pdm ON pessoa_perfil;
CREATE TRIGGER trg_pessoa_perfil_recalc_acesso_pdm AFTER INSERT OR UPDATE OR DELETE ON pessoa_perfil
    FOR EACH ROW
    EXECUTE FUNCTION f_invalida_acesso_pdm_pessoa_perfil();

CREATE OR REPLACE FUNCTION f_invalida_acesso_pdm_pessoa()
    RETURNS trigger
    AS $$
BEGIN
    DELETE FROM pessoa_acesso_pdm_valido WHERE pessoa_id = COALESCE(NEW.id, OLD.id);
    DELETE FROM pessoa_acesso_pdm WHERE pessoa_id = COALESCE(NEW.id, OLD.id);
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pessoa_desativado_recalc_acesso_pdm ON pessoa;
CREATE TRIGGER trg_pessoa_desativado_recalc_acesso_pdm AFTER UPDATE OF desativado ON pessoa
    FOR EACH ROW
    WHEN (OLD.desativado IS DISTINCT FROM NEW.desativado)
    EXECUTE FUNCTION f_invalida_acesso_pdm_pessoa();

CREATE OR REPLACE FUNCTION f_limpa_status_meta_ciclo_fisico_meta()
    RETURNS trigger
    AS $$
BEGIN
    DELETE FROM status_meta_ciclo_fisico WHERE meta_id = NEW.id;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meta_ciclo_fase_limpa_status ON meta;
CREATE TRIGGER trg_meta_ciclo_fase_limpa_status AFTER UPDATE OF ciclo_fase_id ON meta
    FOR EACH ROW
    WHEN (OLD.ciclo_fase_id IS DISTINCT FROM NEW.ciclo_fase_id)
    EXECUTE FUNCTION f_limpa_status_meta_ciclo_fisico_meta();

DROP TRIGGER IF EXISTS trg_etapa_limpa_status_meta ON etapa;
CREATE CONSTRAINT TRIGGER trg_etapa_limpa_status_meta AFTER INSERT OR DELETE OR UPDATE OF inicio_previsto, termino_previsto, inicio_real, termino_real, removido_em, etapa_pai_id ON etapa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_limpa_status_meta_ciclo_fisico();

DROP TRIGGER IF EXISTS trg_cronograma_etapa_limpa_status_meta ON cronograma_etapa;
CREATE CONSTRAINT TRIGGER trg_cronograma_etapa_limpa_status_meta AFTER INSERT OR DELETE OR UPDATE OF inativo, cronograma_id, etapa_id ON cronograma_etapa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION f_limpa_status_meta_ciclo_fisico();
