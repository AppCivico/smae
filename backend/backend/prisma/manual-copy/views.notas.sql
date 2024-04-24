create or replace view view_notas as
SELECT
    id,
    bloco_nota_id,
    tipo_nota_id,
    data_nota,
    orgao_responsavel_id,
    pessoa_responsavel_id,
    nota,
    rever_em,
    dispara_email,
    status,
    n_encaminhamentos AS n_enderecamentos,
    n_repostas,
    ultima_resposta,
    criado_por,
    criado_em,
    removido_por,
    removido_em,

    CASE
        WHEN data_nota <= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + '1 day'::interval AND rever_em IS NOT NULL THEN rever_em
        ELSE data_nota
    END AS data_ordenacao
FROM nota;
