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
                    ( SELECT string_agg(CAST(dr.nome AS TEXT), ' ')
                        FROM distribuicao_recurso dr
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