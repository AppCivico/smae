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

CREATE OR REPLACE VIEW view_notas_transferencias as
SELECT
    nota.id,
    nota.bloco_nota_id,
    nota.data_nota,
    nota.nota,
    nota.status,
    nota.removido_em,

    CASE
        WHEN nota.data_nota <= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + '1 day'::interval AND nota.rever_em IS NOT NULL THEN nota.rever_em
        ELSE nota.data_nota
    END AS data_ordenacao,

    t.id AS transferencia_id,
    t.identificador AS transferencia_identificador
FROM nota
JOIN bloco_nota ON bloco_nota.id = nota.bloco_nota_id
JOIN transferencia t ON 'Transf:' || t.id = bloco_nota.bloco;
