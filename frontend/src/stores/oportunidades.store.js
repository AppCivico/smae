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

    paginação: {
      temMais: false,
      tokenDaPróximaPágina: '',
    },

    erro: null,
  }),
  actions: {
    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        const {
          linhas,
          tem_mais: temMais,
          token_proxima_pagina: tokenDaPróximaPágina,
        } = await this.requestS.get(
          `${baseUrl}/transfere-gov/transferencia`,
          params,
        );
        if (Array.isArray(linhas)) {
          this.lista = params.token_proxima_pagina
            ? this.lista.concat(linhas)
            : linhas;

          this.paginação.temMais = temMais || false;
          this.paginação.tokenDaPróximaPágina = tokenDaPróximaPágina || '';
        }
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
