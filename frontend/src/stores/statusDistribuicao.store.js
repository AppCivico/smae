import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useStatusStore = defineStore('statusStore', {
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
    async buscarItem(idStatus, idDistribuicao = this.route.params.distribuicaoId, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/distribuicao-recurso/${idDistribuicao}/status/${idStatus}`, params);
        this.emFoco = {
          ...resposta,
        };
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },
    async salvarItem(idStatus, idDistribuicao = this.route.params.distribuicaoId, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        if (idStatus) {
          await this.requestS.patch(`${baseUrl}/distribuicao-recurso/${idDistribuicao}/status/${idStatus}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/distribuicao-recurso/${idDistribuicao}/status/`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
  getters: {
    itemParaEdição({ emFoco }) {
      return {
        ...emFoco,
      };
    },
  },
});
