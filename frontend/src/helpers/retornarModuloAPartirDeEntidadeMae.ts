export default ((entidadeMae: string) => {
  switch (entidadeMae) {
    case 'projeto':
    case 'portfolio':
      return 'Projetos';

    case 'mdo':
    case 'obras':
      return 'MDO';

    case 'pdm':
      return 'PDM';

    case 'TransferenciasVoluntarias':
      return 'CasaCivil';

    case 'planoSetorial':
      return 'PlanoSetorial';

    default:
      return '';
  }
});
