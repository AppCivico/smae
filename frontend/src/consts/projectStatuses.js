export default {
  Registrado: {
    nome: '1. Registrado', // Arquivado ou Priorizado caso seja priorizado
    valor: 'Registrado',
    cor: '#f7c234',
  },
  Selecionado: {
    nome: '2. Selecionado', // Arquivado ou EmPlanejamento caso seja Aprovado
    valor: 'Selecionado',
    cor: '#f7c234',
  },
  EmPlanejamento: {
    nome: '3. Em planejamento', // Arquivado ou Validado caso o iniciado
    valor: 'EmPlanejamento',
    cor: '#f7c234',
  },
  Planejado: {
    nome: '4. Planejado',
    valor: 'Planejado',
    cor: '#f7c234',
  },
  Validado: {
    nome: '5. Validado', // EmSuspensao ou EmFechamento caso fechado
    valor: 'Validado',
    cor: '#f7c234',
  },
  EmAcompanhamento: {
    nome: '6. Em acompanhamento', // Suspenso, fechado
    valor: 'EmAcompanhamento',
    cor: '#f7c234',
  },
  Fechado: {
    nome: '7. Concluído', //
    valor: 'Fechado',
    cor: '#8ec122',
  },
  Suspenso: {
    nome: '8. Suspenso', // Volta pra EmAcompanhamento ou Fechado
    valor: 'Suspenso',
    cor: '#ee3b2b',
  },
};
