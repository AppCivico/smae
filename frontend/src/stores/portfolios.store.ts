import dateTimeToDate from '@/helpers/dateTimeToDate';
import { range } from 'lodash';
import { defineStore } from 'pinia';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ListPortfolioDto, PortfolioDto, PortfolioOneDto } from '@/../../backend/src/pp/portfolio/entities/portfolio.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListPortfolioDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: PortfolioOneDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
}

export const usePortfolioStore = defineStore('portfolios', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: true,
      emFoco: true,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/portfolio/${id}`, params);
        this.emFoco = {
          ...resposta,
        };
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/portfolio`, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id: Number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/portfolio/${id}`);

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
          await this.requestS.patch(`${baseUrl}/portfolio/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/portfolio`, params);
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
    itemParaEdição: ({ emFoco }) => ({
      ...emFoco,
      nivel_maximo_tarefa: emFoco?.nivel_maximo_tarefa || 5,
      data_criacao: emFoco?.data_criacao ? dateTimeToDate(emFoco?.data_criacao) : null,
      orcamento_execucao_disponivel_meses: Array.isArray(emFoco?.orcamento_execucao_disponivel_meses)
        ? emFoco.orcamento_execucao_disponivel_meses
        : range(1, 13),
    }),

    portfoliosPorId: ({ lista }: Estado): { [k: number | string]: PortfolioDto } => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
