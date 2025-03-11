import type { RelatorioDto } from '@back/reports/relatorios/entities/report.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = RelatorioDto[];

type RespostaDeLista = {
  tem_mais: boolean;
  token_proxima_pagina: string | null;
  token_ttl: number;
  linhas: RelatorioDto[];
};

interface Estado {
  lista: Lista;
  current: RelatorioDto | Record<string, never>;
  loading: boolean;
  error: null | unknown;

  paginação: {
    temMais: boolean;
    tokenDaPróximaPágina: string;
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
    async getAll(params: { token_proxima_pagina?: string } = {}) {
      this.loading = true;
      try {
        const {
          linhas,
          tem_mais: temMais,
          token_proxima_pagina: tokenDaPróximaPágina,
        } = await this.requestS.get(`${baseUrl}/relatorios`, params) as RespostaDeLista;
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
    async insert(params = {}) {
      if (await this.requestS.post(`${baseUrl}/relatorios`, params)) return true;
      return false;
    },
    async delete(id: number) {
      if (await this.requestS.delete(`${baseUrl}/relatorios/${id}`)) {
        this.lista = this.lista.filter((x) => x.id !== Number(id));
        return true;
      }
      return false;
    },
  },
});
