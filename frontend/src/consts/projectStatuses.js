export default {
  Registrado: {
    nome: 'registrado', // Arquivado ou Priorizado caso seja priorizado
    valor: 'Registrado',
    cor: '#f7c234',
  },
  Selecionado: {
    nome: 'selecionado', // Arquivado ou EmPlanejamento caso seja Aprovado
    valor: 'Selecionado',
    cor: '#f7c234',
  },
  EmPlanejamento: {
    nome: 'em planejamento', // Arquivado ou Validado caso o iniciado
    valor: 'EmPlanejamento',
    cor: '#f7c234',
  },
  Planejado: {
    nome: 'planejado',
    valor: 'Planejado',
    cor: '#f7c234',
  },
  Validado: {
    nome: 'validado', // EmSuspensao ou EmFechamento caso fechado
    valor: 'Validado',
    cor: '#f7c234',
  },
  EmAcompanhamento: {
    nome: 'em acompanhamento', // Suspenso, fechado
    valor: 'EmAcompanhamento',
    cor: '#f7c234',
  },
  Suspenso: {
    nome: 'suspenso', // Volta pra EmAcompanhamento ou Fechado
    valor: 'Suspenso',
    cor: '#ee3b2b',
  },
  Fechado: {
    nome: 'concluído', //
    valor: 'Fechado',
    cor: '#8ec122',
  },
};
