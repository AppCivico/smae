import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useStatusDistribuicaoWorflowStore = defineStore('statusDistribuicaoWorflowStore', {
  state: () => ({
    listaBase: [],
    listaCustomizadas: [],
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
        const resposta = await this.requestS.get(`${baseUrl}/distribuicao-status/${id}`, params);
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
        const { linhas_base: linhasBase, linhas_customizadas: linhasCustomizadas } = await this.requestS.get(`${baseUrl}/distribuicao-status`, params);
        this.listaBase = linhasBase;
        this.listaCustomizadas = linhasCustomizadas;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/distribuicao-status/${id}`);
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
          await this.requestS.patch(`${baseUrl}/distribuicao-status/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/distribuicao-status`, params);
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
    lista: ({ listaBase, listaCustomizadas }) => listaBase.concat(listaCustomizadas),

    itemParaEdicao({ emFoco }) {
      return {
        ...emFoco,
      };
    },
  },
});
