import type { TipoOperacao } from '@back/task/run_update/dto/create-run-update.dto';

type TiposDeOperacoesEmLote = Record<TipoOperacao, {
  nome: string;
  valor: keyof typeof TipoOperacao;
}>;

const tiposDeOperacoesEmLote: TiposDeOperacoesEmLote = {
  Set: {
    nome: 'Substituir',
    valor: 'Set',
  },
  Add: {
    nome: 'Adicionar',
    valor: 'Add',
  },
  Remove: {
    nome: 'Excluir',
    valor: 'Remove',
  },
  CreateTarefa: {
    nome: 'Criar tarefa',
    valor: 'CreateTarefa',
  },
};

export default tiposDeOperacoesEmLote;
