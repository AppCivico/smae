const MapaStatus: Record<string, string> = {
  Registro: 'Em registro',
  Validacao: 'Em Validação',
  Publicado: 'Publicada',
  Encerrado: 'Encerrada',
};

export const mapaSituacaoEncerramento: Record<string, string> = {
  Concluido: 'Concluida',
  Cancelada: 'Cancelada',
};

export type StatusDemanda = 'Registro' | 'Validacao' | 'Publicado' | 'Encerrado';

export default MapaStatus;
