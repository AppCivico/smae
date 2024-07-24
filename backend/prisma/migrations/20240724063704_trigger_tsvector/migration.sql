-- DropForeignKey
ALTER TABLE "distribuicao_parlamentar" DROP CONSTRAINT "distribuicao_parlamentar_distribuicao_recurso_id_fkey";

-- AlterTable
ALTER TABLE "transferencia_parlamentar" ALTER COLUMN "objeto" DROP NOT NULL,
ALTER COLUMN "objeto" DROP DEFAULT,
ALTER COLUMN "valor" DROP NOT NULL,
ALTER COLUMN "valor" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "distribuicao_parlamentar" ADD CONSTRAINT "distribuicao_parlamentar_distribuicao_recurso_id_fkey" FOREIGN KEY ("distribuicao_recurso_id") REFERENCES "distribuicao_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
                COALESCE(tt.nome, '') || ' ' ||
                COALESCE(p.sigla, ' ') || ' ' ||
                COALESCE(p.nome, ' ')  || ' ' ||
                COALESCE(o1.sigla, '') || '' ||
                COALESCE(o1.descricao, '') || '' ||
                COALESCE(o2.sigla, '') || '' ||
                COALESCE(o2.descricao, '') ||
                COALESCE(dr.nome, '')
            )
        FROM (SELECT new.id, new.partido_id, new.orgao_concedente_id, new.secretaria_concedente_id, new.tipo_id ) t
        JOIN transferencia_tipo tt ON tt.id = t.tipo_id
        LEFT JOIN transferencia_parlamentar tp ON tp.transferencia_id = t.id
        LEFT JOIN partido p ON p.id = tp.partido_id
        LEFT JOIN orgao o1 ON o1.id = t.orgao_concedente_id
        LEFT JOIN orgao o2 ON o2.id = t.secretaria_concedente_id
        LEFT JOIN distribuicao_recurso dr ON dr.transferencia_id = t.id AND dr.removido_em IS NULL
    );

    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trigger_transferencia_parlamentar_update_tsvector_insert
BEFORE INSERT ON transferencia_parlamentar
FOR EACH ROW
EXECUTE PROCEDURE f_transferencia_update_tsvector();
