UPDATE relatorio a
SET sistema = x.sistema
FROM pdm x
WHERE x.id = (a.parametros->>'plano_setorial_id')::int
AND a.sistema = 'SMAE'
AND a.fonte IN ('PSOrcamento','PSPrevisaoCusto','PSIndicadores','PSMonitoramentoMensal')
AND x.sistema IN ('PlanoSetorial','ProgramaDeMetas');  -- guarda: não copia SMAE/PDM de volta

UPDATE relatorio
SET sistema = CASE
    WHEN fonte IN ('Obras','ObraStatus','ObrasOrcamento','ObrasPrevisaoCusto')                       THEN 'MDO'::"ModuloSistema"
    WHEN fonte IN ('Orcamento','PrevisaoCusto','Indicadores','MonitoramentoMensal')                  THEN 'PDM'::"ModuloSistema"
    WHEN fonte IN ('Projeto','Projetos','ProjetoStatus','ProjetoOrcamento','ProjetoPrevisaoCusto')   THEN 'Projetos'::"ModuloSistema"
    WHEN fonte IN ('Parlamentares','TribunalDeContas','Transferencias','AtvPendentes','Demandas')    THEN 'CasaCivil'::"ModuloSistema"
END
WHERE sistema = 'SMAE'
AND fonte IN ('Obras','ObraStatus','ObrasOrcamento','ObrasPrevisaoCusto',
              'Orcamento','PrevisaoCusto','Indicadores','MonitoramentoMensal',
              'Projeto','Projetos','ProjetoStatus','ProjetoOrcamento','ProjetoPrevisaoCusto',
              'Parlamentares','TribunalDeContas','Transferencias','AtvPendentes','Demandas');
