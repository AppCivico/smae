import type { TransferenciaRespOperacao } from '@back/pessoa/dto/responsabilidade-pessoa.dto';

type OperacoesDeResponsabilidade = Record<TransferenciaRespOperacao, {
  valor: TransferenciaRespOperacao;
  nome: string;
  descricao: string;
  exigeDestino: boolean;
}>;

const operacoesDeResponsabilidade: OperacoesDeResponsabilidade = {
  transferir: {
    valor: 'transferir',
    nome: 'Transferir',
    descricao: 'A pessoa de destino passa a ser responsável e a pessoa de origem deixa de ser.',
    exigeDestino: true,
  },
  copiar: {
    valor: 'copiar',
    nome: 'Copiar',
    descricao: 'A pessoa de destino passa a ser responsável também, sem retirar a pessoa de origem.',
    exigeDestino: true,
  },
  remover: {
    valor: 'remover',
    nome: 'Remover',
    descricao: 'A pessoa de origem deixa de ser responsável e ninguém é colocado no lugar.',
    exigeDestino: false,
  },
};

export default operacoesDeResponsabilidade;
