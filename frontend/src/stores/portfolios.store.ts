import { requestS } from '@/helpers';
import { defineStore } from 'pinia';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ListPortfolioDto, PortfolioDto } from '@/../../backend/src/pp/portfolio/entities/portfolio.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListPortfolioDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: PortfolioDto;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
}

export const usePortfolioStore = defineStore('portfolios', {
  state: (): Estado => ({
    lista: [],
    emFoco: {
      id: 0,
      titulo: '',
      orgaos: [],
    },

    chamadasPendentes: {
      lista: true,
      emFoco: true,
    },
    erro: null,
  }),
  actions: {
    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;
      try {
        const { linhas } = await requestS.get(`${baseUrl}/portfolio`, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },
    async excluirItem(id: Number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await requestS.delete(`${baseUrl}/portfolio/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },
    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        if (id) {
          await requestS.patch(`${baseUrl}/portfolio/${id}`, params);
        } else {
          await requestS.post(`${baseUrl}/portfolio`, params);
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
    portfoliosPorId: ({ lista }: Estado) => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
