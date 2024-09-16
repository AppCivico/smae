import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useOportunidadesStore = defineStore('oportunidadesStore', {
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
        const { linhas } = await this.requestS.get(`${baseUrl}/transfere-gov/lista`, params);
        this.lista = linhas;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },
    async salvarItem(id, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      if (id) {
        try {
          await this.requestS.patch(`${baseUrl}/transfere-gov/transferencia/${id}`, params);
          this.chamadasPendentes.emFoco = false;
          return true;
        } catch (erro) {
          this.erro = erro;
          this.chamadasPendentes.emFoco = false;
          return false;
        }
      }
      throw new Error('ID inválido.');
    },
  },

  getters: {},
});
