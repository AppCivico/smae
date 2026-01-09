import { defineStore } from 'pinia';

import { useAuthStore } from './auth.store';

interface TermoEncerramentoDto {
  id: number;
  projeto_id: number;
  orgao_responsavel?: string;
  portfolio_id?: number;
  objeto?: string;
  data_inicio_planejado?: string;
  data_termino_planejado?: string;
  data_inicio_real?: string;
  data_termino_real?: string;
  custo_planejado?: number;
  valor_executado_real?: number;
  status_final?: string;
  etapa_projeto?: string;
  justificativa_encerramento_id?: number;
  responsavel_encerramento_id?: number;
  data_encerramento?: string;
  assinatura?: string;
  criado_em?: string;
  atualizado_em?: string;
}

interface ListTermoEncerramentoDto {
  linhas: TermoEncerramentoDto[];
}

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Erros {
  lista: unknown;
  emFoco: unknown;
}

interface Estado {
  lista: TermoEncerramentoDto[];
  emFoco: TermoEncerramentoDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: Erros;
}

function obterRota() {
  const { sistemaEscolhido } = useAuthStore();

  switch (sistemaEscolhido) {
    case 'Projetos':
      return `${import.meta.env.VITE_API_URL}/termo-encerramento`;

    case 'MDO':
      return `${import.meta.env.VITE_API_URL}/obra-termo-encerramento`;

    default:
      throw new Error('Módulo não habilitado');
  }
}

export const useTermoEncerramentoStore = (sistemaEscolhido: string) => defineStore(`${sistemaEscolhido}.termoEncerramento`, {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: {
      lista: null,
      emFoco: null,
    },
  }),
  actions: {
    async buscarItem(termoEncerramentoId: number): Promise<void> {
      try {
        this.chamadasPendentes.emFoco = true;
        this.erro.emFoco = null;

        const resposta = (await this.requestS.get(
          `${obterRota()}/${termoEncerramentoId}`,
        )) as TermoEncerramentoDto;

        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },

    async buscarTudo(params = {}): Promise<void> {
      try {
        this.chamadasPendentes.lista = true;
        this.erro.lista = null;

        const resposta = (await this.requestS.get(
          obterRota(),
          params,
        )) as ListTermoEncerramentoDto;
        this.lista = resposta.linhas;
      } catch (erro: unknown) {
        this.erro.lista = erro;
      } finally {
        this.chamadasPendentes.lista = false;
      }
    },

    async excluirItem(id: number) {
      await this.requestS.delete(`${obterRota()}/${id}`);
    },

    async salvarItem(params = {}, id = 0) {
      try {
        this.chamadasPendentes.emFoco = true;
        this.erro.emFoco = null;

        if (id) {
          await this.requestS.patch(`${obterRota()}/${id}`, params);
        } else {
          await this.requestS.post(obterRota(), params);
        }
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
        throw erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },
  },
})();
