-- Adiciona suporte a acentuação na busca por palavra-chave (full-text search).
-- A extensão unaccent + a config simple_unaccent normalizam os acentos antes de
-- aplicar a config 'simple', permitindo que buscas com e sem acento casem.
CREATE EXTENSION IF NOT EXISTS unaccent;

DO
$$BEGIN
    CREATE TEXT SEARCH CONFIGURATION simple_unaccent (COPY = simple);
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END;$$;

ALTER TEXT SEARCH CONFIGURATION simple_unaccent
    ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part, numword, numhword, hword_numpart
    WITH unaccent, simple;

-- projeto e variavel possuem vetores_busca como coluna GENERATED ALWAYS, então a
-- expressão não pode ser alterada in-place: é preciso remover e recriar a coluna
-- (o ADD COLUMN GENERATED recomputa todas as linhas existentes). Nenhuma das duas
-- colunas tem índice dependente (confirmado: sem GIN em projeto/variavel.vetores_busca),
-- mas o DROP+ADD ainda adquire ACCESS EXCLUSIVE e reescreve a tabela — rodar em janela
-- de baixo tráfego se o volume de linhas for grande em produção.
ALTER TABLE "projeto" DROP COLUMN "vetores_busca";
ALTER TABLE "projeto" ADD COLUMN "vetores_busca" tsvector GENERATED ALWAYS AS (
    to_tsvector('simple_unaccent',
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

ALTER TABLE "variavel" DROP COLUMN "vetores_busca";
ALTER TABLE "variavel" ADD COLUMN "vetores_busca" tsvector GENERATED ALWAYS AS (
    to_tsvector('simple_unaccent',
        COALESCE("titulo", '') || ' '
     || COALESCE("descricao", '') || ' '
     || COALESCE("codigo", '') || ' '
     || COALESCE(REPLACE(REPLACE("codigo", '/', ' '), '.', ' '), '')
    )
) STORED;
