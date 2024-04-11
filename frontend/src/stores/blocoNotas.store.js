import { defineStore } from "pinia";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useBlocoDeNotasStore = defineStore("blocoDeNotasStore", {
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
    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        const { linhas } = await this.requestS.get(
          `${baseUrl}/nota/busca-por-bloco?blocos_token=${params}`
        );
        this.lista = linhas;
      } catch (erro) {
        this.erro = erro;
        console.log("erro: ", erro);
      }
      this.chamadasPendentes.lista = false;
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
