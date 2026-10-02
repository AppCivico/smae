-- AlterTable
ALTER TABLE "projeto"
    ADD COLUMN "vetores_busca" tsvector GENERATED ALWAYS AS (
        to_tsvector('simple',
            COALESCE("nome", '') || ' '
        || COALESCE("codigo", '') || ' '
        || COALESCE("mdo_detalhamento", '') || ' '
        || COALESCE("mdo_observacoes", '') || ' '
        || COALESCE("mdo_programa_habitacional", '') || ' '
        || COALESCE("secretario_responsavel", '') || ' '
        || COALESCE("secretario_executivo", '') || ' '
        || COALESCE("secretario_colaborador", '')
        )
    ) STORED;
