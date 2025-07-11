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
