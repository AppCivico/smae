import { defineStore } from 'pinia';

import dateTimeToDate from '@/helpers/dateTimeToDate';

type DistribuicaoSolicitacaoStatus = 'EmRegistro' | 'Pendente' | 'Aprovada' | 'Recusada';

type DistribuicaoSolicitacaoAjuste = {
  id: number;
  distribuicao_recurso_id: number;
  orgao_gestor_id: number;
  status: DistribuicaoSolicitacaoStatus;
  campos_solicitados: Record<string, { de: unknown; para: unknown }>;
  informacoes_complementares: string | null;
  resposta_motivo: string | null;
  respondido_por: number | null;
  respondido_em: Date | null;
  criado_por: number;
  criado_em: Date;
  atualizado_por: number | null;
  atualizado_em: Date;
  pode_editar: boolean;
  // Campos da distribuição incluídos na resposta da API
  assinatura_estado?: string | null;
  assinatura_municipio?: string | null;
  assinatura_termo_aceite?: string | null;
  data_empenho?: string | null;
  dotacoes?: unknown[];
  conclusao_suspensiva?: string | null;
  vigencia?: string | null;
};

interface Estado {
  lista: DistribuicaoSolicitacaoAjuste[];
  emFoco: DistribuicaoSolicitacaoAjuste | null;
  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
}

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useDistribuicaoSolicitacaoAjusteStore = defineStore('distribuicaoSolicitacaoAjuste', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erros: {
      lista: null,
      emFoco: null,
    },
  }),

  actions: {
    async buscarItem(id = 0, params: Record<string, unknown> = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/distribuicao-recurso-solicitacao-ajuste/${id}`,
          params,
        );
        this.emFoco = resposta;
      } catch (erro) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params: Record<string, unknown> = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/distribuicao-recurso-solicitacao-ajuste`,
          params,
        );
        this.lista = resposta.linhas || [];
      } catch (erro) {
        this.erros.lista = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async salvarItem(params: Record<string, unknown> = {}, id = 0): Promise<unknown> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        let resposta;
        if (id) {
          resposta = await this.requestS.patch(
            `${baseUrl}/distribuicao-recurso-solicitacao-ajuste/${id}`,
            params,
          );
        } else {
          resposta = await this.requestS.post(
            `${baseUrl}/distribuicao-recurso-solicitacao-ajuste`,
            params,
          );
        }
        this.chamadasPendentes.emFoco = false;
        return resposta || true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async aplicarDecisao(id: number, decisao: 'Aprovada' | 'Recusada'): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        await this.requestS.patch(
          `${baseUrl}/distribuicao-recurso-solicitacao-ajuste/${id}/gestao`,
          { decisao },
        );
        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },

  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      assinatura_estado: dateTimeToDate(emFoco?.assinatura_estado),
      assinatura_municipio: dateTimeToDate(emFoco?.assinatura_municipio),
      assinatura_termo_aceite: dateTimeToDate(emFoco?.assinatura_termo_aceite),
      data_empenho: dateTimeToDate(emFoco?.data_empenho),
      dotacoes: emFoco?.dotacoes || [],
      conclusao_suspensiva: dateTimeToDate(emFoco?.conclusao_suspensiva),
      vigencia: dateTimeToDate(emFoco?.vigencia),
    }),
  },
});
