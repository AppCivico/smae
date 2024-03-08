
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
