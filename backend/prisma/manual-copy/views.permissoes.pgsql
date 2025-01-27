CREATE OR REPLACE VIEW view_meta_pessoa_responsavel AS
SELECT
    mr.*
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id
        AND mr.meta_id = mo.meta_id
WHERE
    mo.responsavel;

CREATE OR REPLACE VIEW public.view_meta_pessoa_responsavel_na_cp AS
 SELECT mr.id,
    mr.meta_id,
    mr.pessoa_id,
    pf.orgao_id,
    mr.coordenador_responsavel_cp
   FROM meta_responsavel mr
      join pessoa p on mr.pessoa_id = p.id
     JOIN pessoa_fisica pf ON pf.id = p.pessoa_fisica_id
  WHERE mr.coordenador_responsavel_cp and pf.orgao_id is not null;



-- TODO rever essas views, pois existem tbm os relacionamentos de iniciativa e atividade
CREATE OR REPLACE VIEW view_meta_responsavel_orcamento AS
SELECT
    mr.meta_id, mr.pessoa_id
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id AND mr.meta_id = mo.meta_id
    join pessoa_perfil pp on pp.pessoa_id = mr.pessoa_id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio p on p.id = priv.privilegio_id
    join public.pessoa pessoa on pessoa.id = pp.pessoa_id AND pessoa.desativado = false
WHERE mo.responsavel AND p.codigo in (
    'CadastroMeta.orcamento', 'CadastroMeta.administrador_orcamento'
)
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_espectador_de_projeto AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('SMAE.espectador_de_projeto' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_ps_admin_cp AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('PS.admin_cp' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_ps_tecnico_cp AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('PS.tecnico_cp' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_gestor_de_projeto AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('SMAE.gestor_de_projeto' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_colaborador_de_projeto AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('SMAE.colaborador_de_projeto' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_espectador_de_painel_externo AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('SMAE.espectador_de_painel_externo' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_coordenador_responsavel_cp AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('PDM.coordenador_responsavel_cp' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;


CREATE OR REPLACE VIEW view_atividade_pessoa_responsavel AS
SELECT
    a.id,
    mr.meta_id,
    mr.pessoa_id,
    mr.orgao_id,
    i.id as iniciativa_id,
    a.id as atividade_id
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id
        AND mr.meta_id = mo.meta_id
    JOIN iniciativa i ON i.meta_id = mr.meta_id
    JOIN atividade a ON a.iniciativa_id = i.id
    JOIN atividade_responsavel ar ON ar.atividade_id = a.id AND ar.pessoa_id = mr.pessoa_id
    JOIN atividade_orgao ao ON ao.atividade_id = a.id AND ao.orgao_id = mr.orgao_id

WHERE
    mo.responsavel
    AND ao.responsavel
AND a.removido_em is null
;

CREATE OR REPLACE VIEW view_iniciativa_pessoa_responsavel AS
SELECT
    i.id,
    mr.meta_id,
    mr.pessoa_id,
    mr.orgao_id,
    i.id as iniciativa_id
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id
        AND mr.meta_id = mo.meta_id
    JOIN iniciativa i ON i.meta_id = mr.meta_id
    JOIN iniciativa_responsavel ir ON ir.iniciativa_id = i.id AND ir.pessoa_id = mr.pessoa_id
    JOIN iniciativa_orgao io ON io.iniciativa_id = i.id AND io.orgao_id = mr.orgao_id

WHERE
    mo.responsavel
    AND io.responsavel
AND i.removido_em is null
;
