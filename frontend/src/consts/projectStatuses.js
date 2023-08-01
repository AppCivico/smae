export default {
  Registrado: 'registrado', // Arquivado ou Priorizado caso seja priorizado
  Selecionado: 'selecionado', // Arquivado ou EmPlanejamento caso seja Aprovado
  EmPlanejamento: 'em planejamento', // Arquivado ou Validado caso o iniciado
  Planejado: 'planejado',
  Validado: 'validado', // EmSuspensao ou EmFechamento caso fechado
  EmAcompanhamento: 'em acompanhamento', // Suspenso, fechado
  Suspenso: 'suspenso', // Volta pra EmAcompanhamento ou Fechado
  Fechado: 'concluído', //
};
