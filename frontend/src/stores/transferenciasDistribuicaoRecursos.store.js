import dateTimeToDate from '@/helpers/dateTimeToDate';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useDistribuicaoRecursosStore = defineStore('distribuicaoRecursos', {
  state: () => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/distribuicao-recurso/${id}`,
          params,
        );
        this.emFoco = {
          ...resposta,
        };
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(
          `${baseUrl}/distribuicao-recurso`,
          params,
        );
        this.lista = linhas;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/distribuicao-recurso/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        if (id) {
          await this.requestS.patch(
            `${baseUrl}/distribuicao-recurso/${id}`,
            params,
          );
        } else {
          await this.requestS.post(`${baseUrl}/distribuicao-recurso`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async selectionarSeiLido({ id, processoSei, lido }) {
      try {
        this.erro = null;

        await this.requestS.post(
          `${baseUrl}/distribuicao-recurso/${id}/marcar-sei-como-lido`,
          {
            processo_sei: processoSei,
            lido,
          },
        );
      } catch (erro) {
        this.erro = erro;
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
      conclusao_suspensiva: dateTimeToDate(emFoco?.conclusao_suspensiva),
      orgao_gestor_id: emFoco?.orgao_gestor?.id || null,
      vigencia: dateTimeToDate(emFoco?.vigencia),
      justificativa_aditamento:
        emFoco?.aditamentos?.find(
          (aditamento) => aditamento?.data_vigencia_corrente === dateTimeToDate(emFoco?.vigencia),
        )?.justificativa || null,
    }),
  },
});
