CREATE OR REPLACE VIEW view_projeto_mdo AS
WITH ProjetoRegioes AS (
    SELECT
        pr.projeto_id,
        json_agg(json_build_object('descricao', r.descricao, 'nivel', r.nivel)) AS regioes_data
    FROM projeto_regiao pr
    JOIN regiao r ON pr.regiao_id = r.id AND r.removido_em IS NULL
    WHERE pr.removido_em IS NULL
    GROUP BY pr.projeto_id
)
SELECT
  p.id,
  p.nome,
  p.codigo,
  p.portfolio_id,
  p.grupo_tematico_id,
  gt.nome AS grupo_tematico_nome,
  p.tipo_intervencao_id,
  ti.nome AS tipo_intervencao_nome,
  p.equipamento_id,
  e.nome AS equipamento_nome,
  p.orgao_origem_id,
  coalesce((
    SELECT string_agg(regiao->>'descricao', ', ')
    FROM json_array_elements(pr.regioes_data) AS regiao
    WHERE (regiao ->> 'nivel')::int = port.nivel_regionalizacao
  ), '') AS regioes,
  p.status,
  port.titulo AS portfolio_titulo,
  p.registrado_em,
  p.empreendimento_id,
  emp.nome AS empreendimento_nome,
  emp.identificador AS empreendimento_identificador
FROM projeto AS p
JOIN portfolio port ON p.portfolio_id = port.id
LEFT JOIN grupo_tematico AS gt ON p.grupo_tematico_id = gt.id
LEFT JOIN tipo_intervencao AS ti ON p.tipo_intervencao_id = ti.id
LEFT JOIN equipamento AS e ON p.equipamento_id = e.id
LEFT JOIN empreendimento AS emp ON p.empreendimento_id = emp.id
LEFT JOIN ProjetoRegioes pr ON p.id = pr.projeto_id
WHERE p.removido_em IS NULL;
