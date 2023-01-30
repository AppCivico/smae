import { requestS } from '@/helpers';
import { defineStore } from 'pinia';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ListPortfolioDto, PortfolioDto } from '@/../../backend/src/pp/portfolio/entities/portfolio.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface ChamadasPendentes {
  lista: boolean,
  emFoco: boolean,
}

interface Estado {
  lista: ListPortfolioDto['linhas'];
  emFoco: PortfolioDto | null;
  chamadasPendentes: ChamadasPendentes;
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
    async buscarTudo(this: {
      chamadasPendentes: ChamadasPendentes;
      lista: ListPortfolioDto['linhas'];
      erro: unknown;
    }, params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      try {
        const { linhas } = await requestS.get(`${baseUrl}/portfolio`, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },
  },
});
