CREATE OR REPLACE FUNCTION f_transferencia_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    new.vetores_busca = (
        SELECT
            to_tsvector(
                'simple',
                COALESCE(CAST(NEW.esfera AS TEXT), '') || ' ' ||
                COALESCE(CAST(NEW.interface AS TEXT), '') || ' ' ||
                COALESCE(CAST(NEW.ano AS TEXT), '') || ' ' ||
                COALESCE(NEW.gestor_contrato, ' ') || ' ' ||
                COALESCE(NEW.secretaria_concedente_str, ' ') || ' ' ||
                COALESCE(NEW.emenda, ' ') || ' ' ||
                COALESCE(NEW.nome_programa, ' ') || ' ' ||
                COALESCE(NEW.objeto, ' ') || ' ' ||
                COALESCE(NEW.demanda, ' ') || ' ' ||
                COALESCE(tt.nome, ' ') || ' ' ||
                COALESCE(o1.sigla, ' ') || ' ' ||
                COALESCE(o1.descricao, ' ') || ' ' ||
                COALESCE(o2.sigla, ' ') || ' ' ||
                COALESCE(o2.descricao, ' ') || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(p.nome_popular AS TEXT), ' ')
                        FROM transferencia_parlamentar tp
                        JOIN parlamentar p ON p.id = tp.parlamentar_id
                        WHERE tp.transferencia_id = NEW.id AND tp.removido_em IS NULL
                    ),
                    ' '
                ) || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(p.sigla AS TEXT), ' ')
                        FROM transferencia_parlamentar tp
                        JOIN partido p ON p.id = tp.partido_id
                        WHERE tp.transferencia_id = NEW.id AND tp.removido_em IS NULL
                    ),
                    ' '
                ) || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(tp.cargo AS TEXT), ' ')
                        FROM transferencia_parlamentar tp
                        JOIN partido p ON p.id = tp.partido_id
                        WHERE tp.transferencia_id = NEW.id AND tp.removido_em IS NULL
                    ),
                    ' '
                ) || ' ' ||
                COALESCE(
                    ( SELECT string_agg(
                        CAST(o.sigla AS TEXT) || ' ' || CAST(o.descricao AS TEXT), ' ')
                        FROM distribuicao_recurso dr
                        JOIN orgao o ON o.id = dr.orgao_gestor_id
                        WHERE dr.transferencia_id = t.id AND dr.removido_em IS NULL
                    ),
                    ' '
                )
            )
        FROM (SELECT new.id, new.orgao_concedente_id, new.secretaria_concedente_id, new.tipo_id ) t
        JOIN transferencia_tipo tt ON tt.id = t.tipo_id
        LEFT JOIN orgao o1 ON o1.id = t.orgao_concedente_id
        LEFT JOIN orgao o2 ON o2.id = t.secretaria_concedente_id
    );

    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';


DO
$$BEGIN

-- DROP TRIGGER trigger_transferencia_update_tsvector_update ON transferencia ;
CREATE TRIGGER trigger_transferencia_update_tsvector_update
BEFORE UPDATE ON transferencia
FOR EACH ROW
WHEN (
    OLD.objeto IS DISTINCT FROM NEW.objeto
        OR
    OLD.interface IS DISTINCT FROM NEW.interface
        OR
    OLD.ano IS DISTINCT FROM NEW.ano
        OR
    OLD.esfera IS DISTINCT FROM NEW.esfera
        OR
    OLD.gestor_contrato IS DISTINCT FROM NEW.gestor_contrato
        OR
    OLD.tipo_id IS DISTINCT FROM NEW.tipo_id
        OR
    OLD.orgao_concedente_id IS DISTINCT FROM NEW.orgao_concedente_id
        OR
    OLD.secretaria_concedente_id IS DISTINCT FROM NEW.secretaria_concedente_id
        OR
    OLD.emenda IS DISTINCT FROM NEW.emenda
    OR
    OLD.demanda IS DISTINCT FROM NEW.demanda
        OR
    OLD.nome_programa IS DISTINCT FROM NEW.nome_programa
        OR
    OLD.vetores_busca::varchar = ''
)
EXECUTE PROCEDURE f_transferencia_update_tsvector();

CREATE TRIGGER trigger_transferencia_update_tsvector_insert
BEFORE INSERT ON transferencia
FOR EACH ROW
EXECUTE PROCEDURE f_transferencia_update_tsvector();

-- DROP TRIGGER trigger_distribuicao_update_tsvector_insert;
CREATE TRIGGER trigger_distribuicao_update_tsvector_insert
BEFORE INSERT ON distribuicao_recurso
FOR EACH ROW
EXECUTE PROCEDURE f_transferencia_update_tsvector();

CREATE TRIGGER trigger_distribuicao_update_tsvector_update
BEFORE UPDATE ON distribuicao_recurso
FOR EACH ROW
WHEN ( OLD.nome IS DISTINCT FROM NEW.nome )
EXECUTE PROCEDURE f_transferencia_update_tsvector();
EXCEPTION
   WHEN duplicate_object THEN
      NULL;
END;$$;

CREATE OR REPLACE FUNCTION f_transferencia_parlamentar_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    UPDATE transferencia
    SET vetores_busca = (
        SELECT
            to_tsvector(
                'simple',
                COALESCE(CAST(t.esfera AS TEXT), '') || ' ' ||
                COALESCE(CAST(t.interface AS TEXT), '') || ' ' ||
                COALESCE(CAST(t.ano AS TEXT), '') || ' ' ||
                COALESCE(t.gestor_contrato, ' ') || ' ' ||
                COALESCE(t.secretaria_concedente_str, ' ') || ' ' ||
                COALESCE(t.emenda, ' ') || ' ' ||
                COALESCE(t.nome_programa, ' ') || ' ' ||
                COALESCE(t.objeto, ' ') || ' ' ||
                COALESCE(tt.nome, ' ') || ' ' ||
                COALESCE(o1.sigla, ' ') || ' ' ||
                COALESCE(o1.descricao, ' ') || ' ' ||
                COALESCE(o2.sigla, ' ') || ' ' ||
                COALESCE(o2.descricao, ' ') || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(p.nome_popular AS TEXT), ' ')
                        FROM transferencia_parlamentar tp
                        JOIN parlamentar p ON p.id = tp.parlamentar_id
                        WHERE tp.transferencia_id = t.id AND tp.removido_em IS NULL
                    ),
                    ' '
                ) || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(p.sigla AS TEXT), ' ')
                        FROM transferencia_parlamentar tp
                        JOIN partido p ON p.id = tp.partido_id
                        WHERE tp.transferencia_id = t.id AND tp.removido_em IS NULL
                    ),
                    ' '
                ) || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(tp.cargo AS TEXT), ' ')
                        FROM transferencia_parlamentar tp
                        JOIN partido p ON p.id = tp.partido_id
                        WHERE tp.transferencia_id = t.id AND tp.removido_em IS NULL
                    ),
                    ' '
                ) || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(dr.nome AS TEXT), ' ')
                        FROM distribuicao_recurso dr
                        WHERE dr.transferencia_id = t.id AND dr.removido_em IS NULL
                    ),
                    ' '
                )
            )
        FROM transferencia t
        JOIN transferencia_tipo tt ON tt.id = t.tipo_id
        LEFT JOIN orgao o1 ON o1.id = t.orgao_concedente_id
        LEFT JOIN orgao o2 ON o2.id = t.secretaria_concedente_id
        WHERE t.id = NEW.transferencia_id
    )
    WHERE id = NEW.transferencia_id;

    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

DO
$$BEGIN
CREATE TRIGGER trigger_transferencia_parlamentar_update_tsvector
AFTER INSERT OR UPDATE ON transferencia_parlamentar
FOR EACH ROW
WHEN (NEW.removido_em IS NULL)
EXECUTE PROCEDURE f_transferencia_parlamentar_update_tsvector();
EXCEPTION
   WHEN duplicate_object THEN
      NULL;
END;$$;

CREATE OR REPLACE FUNCTION f_transfere_gov_oportunidade_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    NEW.vetores_busca = (
        SELECT to_tsvector('simple',
            COALESCE(CAST(NEW.tipo AS TEXT), '') || ' ' ||
            COALESCE(CAST(NEW.avaliacao AS TEXT), '') || ' ' ||
            COALESCE(CAST(NEW.id_programa AS TEXT), '') || ' ' ||
            COALESCE(NEW.natureza_juridica_programa, '') || ' ' ||
            COALESCE(CAST(NEW.transferencia_incorporada AS TEXT), '') || ' ' ||
            COALESCE(CAST(NEW.cod_orgao_sup_programa AS TEXT), '') || ' ' ||
            COALESCE(NEW.desc_orgao_sup_programa, '') || ' ' ||
            COALESCE(CAST(NEW.cod_programa AS TEXT), '') || ' ' ||
            COALESCE(NEW.nome_programa, '') || ' ' ||
            COALESCE(NEW.sit_programa, '') || ' ' ||
            COALESCE(CAST(NEW.ano_disponibilizacao AS TEXT), '') || ' ' ||
            COALESCE(CAST(NEW.data_disponibilizacao AS TEXT), '') || ' ' ||
            COALESCE(CAST(NEW.dt_ini_receb AS TEXT), '') || ' ' ||
            COALESCE(CAST(NEW.dt_fim_receb AS TEXT), '') || ' ' ||
            COALESCE(NEW.modalidade_programa, '') || ' ' ||
            COALESCE(NEW.acao_orcamentaria, '')
        )
    );
    RETURN NEW;
END
$$ LANGUAGE plpgsql;


DO
$$BEGIN
-- Trigger to call the function
CREATE TRIGGER trigger_transfere_gov_oportunidade_update_tsvector
BEFORE INSERT OR UPDATE ON transfere_gov_oportunidade
FOR EACH ROW
EXECUTE FUNCTION f_transfere_gov_oportunidade_update_tsvector();
EXCEPTION
   WHEN duplicate_object THEN
      NULL;
END;$$;
