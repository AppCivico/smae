import dateTimeToDate from '@/helpers/dateTimeToDate';
import type {
  ListPortfolioDto,
  PortfolioDto,
  PortfolioOneDto,
} from '@back/pp/portfolio/entities/portfolio.entity';
import { range } from 'lodash';
import { defineStore } from 'pinia';

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
  erro: {
    lista: null | unknown;
    emFoco: null | unknown;
  };
}

export const usePortfolioObraStore = defineStore('portfoliosMdo', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: {
      lista: null,
      emFoco: null,
    },
  }),
  actions: {
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erro.emFoco = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/portfolio-mdo/${id}`, params);
        this.emFoco = {
          ...resposta,
        };
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}, paraObras = true): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erro.lista = null;

      const caminho = paraObras ? `${baseUrl}/portfolio-mdo/para-obras` : `${baseUrl}/portfolio-mdo`;

      try {
        const { linhas } = await this.requestS.get(caminho, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro.lista = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;
      this.erro.lista = null;

      try {
        await this.requestS.delete(`${baseUrl}/portfolio-mdo/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro.lista = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erro.emFoco = null;

      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/portfolio-mdo/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/portfolio-mdo`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },

  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      nivel_maximo_tarefa: emFoco?.nivel_maximo_tarefa || 5,
      nivel_regionalizacao: emFoco?.nivel_regionalizacao || 1,
      data_criacao: emFoco?.data_criacao ? dateTimeToDate(emFoco?.data_criacao) : null,
      orcamento_execucao_disponivel_meses: emFoco?.orcamento_execucao_disponivel_meses
        && Array.isArray(emFoco.orcamento_execucao_disponivel_meses)
        ? emFoco.orcamento_execucao_disponivel_meses
        : range(1, 13),
    }),

    portfoliosPorId: ({ lista }: Estado): { [k: number | string]: PortfolioDto } => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
