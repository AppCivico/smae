CREATE OR REPLACE FUNCTION f_parlamentar_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    new.vetores_busca = (
        SELECT
            to_tsvector(
                'simple',
                COALESCE(NEW.nome, '') || ' ' ||
                COALESCE(NEW.nome_popular, '') || ' ' ||
                COALESCE(
                    case when NEW.cargo_mais_recente::TEXT = 'DeputadoEstadual' then 'Deputado Estadual'
                         when NEW.cargo_mais_recente::TEXT = 'DeputadoFederal' then 'Deputado Federal'
                         else NEW.cargo_mais_recente::TEXT end, '') || ' ' ||
                COALESCE(
                    (
                        SELECT string_agg(
                            COALESCE(p.nome, '') || ' ' ||
                            COALESCE(p.sigla, ''),
                            ' '
                        )
                        FROM parlamentar_mandato pm
                        JOIN partido p ON p.id = pm.partido_candidatura_id
                        WHERE pm.parlamentar_id = NEW.id
                        AND pm.removido_em IS NULL
                    ),
                    ''
                )
            )
    );
    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS tsvector_parlamentar_update ON parlamentar;
CREATE TRIGGER tsvector_parlamentar_update
    BEFORE INSERT OR UPDATE ON parlamentar
    FOR EACH ROW
    EXECUTE FUNCTION f_parlamentar_update_tsvector();

-- caso mude o nome do partido ou a sigla, atualiza o tsvector
CREATE OR REPLACE FUNCTION f_parlamentar_mandato_update_parent() RETURNS TRIGGER AS $$
BEGIN
    -- se não mudou nada, não precisa atualizar
    IF TG_OP = 'UPDATE' AND
       OLD.partido_candidatura_id = NEW.partido_candidatura_id AND
       OLD.parlamentar_id = NEW.parlamentar_id AND
       (OLD.removido_em IS NULL) = (NEW.removido_em IS NULL) THEN
        RETURN NEW;
    END IF;

    UPDATE parlamentar
    SET atualizado_em = NOW()
    WHERE id = COALESCE(NEW.parlamentar_id, OLD.parlamentar_id);

    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_parlamentar_mandato_update_parent ON parlamentar_mandato;
CREATE TRIGGER trigger_parlamentar_mandato_update_parent
    AFTER INSERT OR UPDATE OR DELETE ON parlamentar_mandato
    FOR EACH ROW
    EXECUTE FUNCTION f_parlamentar_mandato_update_parent();

UPDATE parlamentar SET atualizado_em = NOW();
