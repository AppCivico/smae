import { requestS } from '@/helpers';
import { defineStore } from 'pinia';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ListPortfolioDto, PortfolioDto } from '@/../../backend/src/pp/portfolio/entities/portfolio.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface Estado {
  lista: ListPortfolioDto['linhas'];
  emFoco: PortfolioDto | null;
  chamadasPendentes: {
    lista: boolean,
    emFoco: boolean,
  };
  erro: null | Error,
}

export const usePortfolioStore = defineStore('portfolios', {
  state: (): Estado => ({
    lista: [],
    emFoco: null as PortfolioDto | null,

    chamadasPendentes: {
      lista: true,
      emFoco: true,
    },
    erro: null,
  }),
  actions: {
    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      try {
        const { linhas } = await requestS.get(`${baseUrl}/portfolio`, params);
        this.lista = linhas;
      } catch (erro) {
        this.$patch({ erro });
      }
      this.chamadasPendentes.lista = false;
    },
  },
});
