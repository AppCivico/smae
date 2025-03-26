UPDATE variavel_ciclo_corrente vcc
SET liberacao_enviada = true
FROM variavel_global_ciclo_analise vgca
WHERE vcc.variavel_id = vgca.variavel_id
  AND vcc.ultimo_periodo_valido = vgca.referencia_data
  AND vgca.fase = 'Liberacao'
  AND vgca.ultima_revisao = true
  AND (vgca.eh_liberacao_auto = true OR vgca.aprovada = true) and vcc.fase='Liberacao' and liberacao_enviada=false;
