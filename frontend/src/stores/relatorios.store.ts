import { defineStore } from 'pinia';
// eslint-disable-next-line import/no-extraneous-dependencies
import { RelatorioDto } from '@/../../backend/src/reports/relatorios/entities/report.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = RelatorioDto[];

interface Estado {
  lista: Lista;
  current: RelatorioDto | {};
  loading: Boolean;
  error: null | unknown;

  paginação: {
    temMais: Boolean;
    tokenDaPróximaPágina: String;
  };
}

export const useRelatoriosStore = defineStore('relatorios', {
  state: (): Estado => ({
    lista: [],
    current: {},
    loading: false,
    error: null,

    paginação: {
      temMais: false,
      tokenDaPróximaPágina: '',
    },

  }),
  actions: {
    async getAll(params: { token_proxima_pagina?: String } = {}) {
      this.loading = true;
      try {
        const {
          linhas,
          tem_mais: temMais,
          token_proxima_pagina: tokenDaPróximaPágina,
        } = await this.requestS.get(`${baseUrl}/relatorios`, params);
        if (Array.isArray(linhas)) {
          this.lista = params.token_proxima_pagina
            ? this.lista.concat(linhas)
            : linhas;

          this.paginação.temMais = temMais || false;
          this.paginação.tokenDaPróximaPágina = tokenDaPróximaPágina || '';
        }
      } catch (error) {
        this.error = error;
      }
      this.loading = false;
    },
    async insert(params: {}) {

console.log(params);

      if (await this.requestS.post(`${baseUrl}/relatorios`, params)) return true;
      return false;
    },
    async delete(id: number) {
      if (await this.requestS.delete(`${baseUrl}/relatorios/${id}`)) {
        this.lista = this.lista.filter((x) => x.id != id);
        return true;
      }
      return false;
    },
  },
});
