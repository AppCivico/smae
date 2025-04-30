UPDATE atualizacao_em_lote
SET operacao = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'col', elem->'col',
            'tipo_operacao', 'Set',
            'valor', elem->'set'
        )
    )
    FROM jsonb_array_elements(operacao::jsonb) AS elem
)
WHERE operacao IS NOT NULL;
