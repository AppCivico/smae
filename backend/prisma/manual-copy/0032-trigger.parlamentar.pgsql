create index if not exists ix_parlamentar_id on parlamentar_mandato (parlamentar_id ) where removido_em is null;

CREATE OR REPLACE FUNCTION f_parlamentar_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    --raise notice 'Updating tsvector for parlamentar %', NEW.id;

    NEW.vetores_busca = COALESCE((
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
    ), '');
    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

-- Remove trigger anterior se existir e cria novo
-- Este trigger só dispara quando os campos relevantes são alterados
DROP TRIGGER IF EXISTS tsvector_parlamentar_update ON parlamentar;
CREATE TRIGGER tsvector_parlamentar_update
    BEFORE UPDATE ON parlamentar
    FOR EACH ROW
    WHEN (
        NEW.nome IS DISTINCT FROM OLD.nome OR
        NEW.nome_popular IS DISTINCT FROM OLD.nome_popular OR
        NEW.cargo_mais_recente IS DISTINCT FROM OLD.cargo_mais_recente OR
        (OLD.vetores_busca IS NULL OR OLD.vetores_busca = ''
        OR NEW.vetores_busca IS NULL)
    )
    EXECUTE FUNCTION f_parlamentar_update_tsvector();

DROP TRIGGER IF EXISTS tsvector_parlamentar_insert ON parlamentar;
CREATE TRIGGER tsvector_parlamentar_insert
    BEFORE INSERT ON parlamentar
    FOR EACH ROW
    EXECUTE FUNCTION f_parlamentar_update_tsvector();

-- Função que atualiza o parlamentar quando há mudanças em seus mandatos
CREATE OR REPLACE FUNCTION f_parlamentar_mandato_update_parent() RETURNS TRIGGER AS $$
BEGIN
    -- Pula a atualização se nada relevante mudou
    IF TG_OP = 'UPDATE' AND
       OLD.partido_candidatura_id = NEW.partido_candidatura_id AND
       OLD.parlamentar_id = NEW.parlamentar_id AND
       (OLD.removido_em IS NULL) = (NEW.removido_em IS NULL) THEN
        RETURN NEW;
    END IF;

    -- Atualiza para null para forçar a atualização do vetor de busca
    UPDATE parlamentar
    SET  vetores_busca = null
    WHERE id = COALESCE(NEW.parlamentar_id, OLD.parlamentar_id);


    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

-- Remove trigger anterior se existir e cria novo
-- Este trigger dispara quando há mudanças nos mandatos do parlamentar
DROP TRIGGER IF EXISTS trigger_parlamentar_mandato_update_parent ON parlamentar_mandato;
CREATE TRIGGER trigger_parlamentar_mandato_update_parent
    AFTER INSERT OR UPDATE OR DELETE ON parlamentar_mandato
    FOR EACH ROW
    EXECUTE FUNCTION f_parlamentar_mandato_update_parent();

UPDATE parlamentar SET vetores_busca = null;
