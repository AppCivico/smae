import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useDemandaPublicaStore = defineStore('demandaPublica', {
  state: () => ({
    emFoco: null,
    chamadasPendentes: {
      emFoco: false,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(id) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/public/demandas/${id}`,
          null,
          { AlertarErros: false },
        );

        this.emFoco = resposta.demanda;
      } catch (e) {
        this.erro = e;
        throw e;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },
  },
});
