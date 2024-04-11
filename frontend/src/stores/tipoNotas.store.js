import { defineStore } from "pinia";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useTipoDeNotasStore = defineStore("tipoDeNotasStore", {
  state: () => ({
    lista: [],

    chamadasPendentes: {
      lista: false,
    },
    erro: null,
  }),
  actions: {
    async buscarTudo() {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/tipo-nota`);
        this.lista = linhas;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },
  },
});
