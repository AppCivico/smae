-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_calc_regiao_id_fkey" FOREIGN KEY ("calc_regiao_id") REFERENCES "regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

CREATE TRIGGER trigger_transferencia_parlamentar_update_tsvector
AFTER INSERT OR UPDATE ON transferencia_parlamentar
FOR EACH ROW
WHEN (NEW.removido_em IS NULL)
EXECUTE PROCEDURE f_transferencia_parlamentar_update_tsvector();

