import type {
  DashboardItemComOpcoesDto,
  DashboardItemDto,
  DashboardLinhasDto,
  DashboardOptionDto,
} from '@back/dashboard/entities/dashboard.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = DashboardLinhasDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
}

interface Estado {
  lista: Lista;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
}

export const useDashboardStore = defineStore('dashboard', {
  state: (): Estado => ({
    lista: [],

    chamadasPendentes: {
      lista: true,
    },
    erro: null,
  }),

  actions: {
    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/dashboard`, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },
  },

  getters: {
    dashboardEmFoco(): DashboardItemComOpcoesDto | DashboardItemDto | null {
      const { lista, route: { query: { id } } } = this;

      return (!id
        ? undefined
        : lista.find((x) => x.id === Number(id))
      ) || null;
    },

    opçãoEmFoco(): DashboardOptionDto | null {
      const { dashboardEmFoco, route: { query: { opcao: opção } } } = this;

      return !dashboardEmFoco?.opcoes || !Array.isArray(dashboardEmFoco.opcoes)
        ? null
        : dashboardEmFoco.opcoes.find((x: DashboardOptionDto) => x.id === Number(opção)) || null;
    },

    endereçoParaIframe(): string | null {
      const { dashboardEmFoco, opçãoEmFoco } = this;

      return opçãoEmFoco?.url || dashboardEmFoco?.url || '';
    },
  },
});
