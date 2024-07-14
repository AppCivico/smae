-- AlterTable
ALTER TABLE "projeto"
    DROP COLUMN "vetores_busca";

ALTER TABLE "projeto"
    ADD COLUMN "vetores_busca" tsvector GENERATED ALWAYS AS (
        to_tsvector('simple',
            COALESCE("nome", '') || ' '
        || COALESCE("codigo", '') || ' '
        || COALESCE(REPLACE("codigo", '.', ' '), '') || ' '
        || COALESCE("mdo_detalhamento", '') || ' '
        || COALESCE("mdo_observacoes", '') || ' '
        || COALESCE("mdo_programa_habitacional", '') || ' '
        || COALESCE("secretario_responsavel", '') || ' '
        || COALESCE("secretario_executivo", '') || ' '
        || COALESCE("secretario_colaborador", '')
        )
    ) STORED;

ALTER TABLE "variavel"
    DROP COLUMN "vetores_busca";

ALTER TABLE "variavel"
    ADD COLUMN "vetores_busca" tsvector GENERATED ALWAYS AS (
        to_tsvector('simple',
            COALESCE("titulo", '') || ' '
        || COALESCE("descricao", '') || ' '
        || COALESCE("codigo", '') || ' '
        || COALESCE(REPLACE(REPLACE("codigo", '/', ' '), '.', ' '), '')
        )
    ) STORED;
