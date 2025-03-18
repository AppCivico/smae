import type { PSMFRespostaDashboardDto } from '@back/mf/ps-dash/dto/ps.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  variaveis: boolean;
  estatisticasMetas: boolean;
  listaMetas: boolean;
};

type Erros = {
  variaveis: null | unknown;
  estatisticasMetas: null | unknown;
  listaMetas: null | unknown;
};

type Estado = {
  variaveis: PSMFRespostaDashboardDto['variaveis'] | null;
  estatisticasMetas: PSMFRespostaDashboardDto['estatisticas_metas'] | null;

  listaMetas: PSMFRespostaDashboardDto['lista_metas']['itens'] | null;
  cicloAtual: PSMFRespostaDashboardDto['lista_metas']['ciclo_atual'] | null;

  chamadasPendentes: ChamadasPendentes;

  erros: Erros;

  paginacaoDeMetas: Paginacao;
};

export type Parametros = {
  pdm_id: number;
  orgao_id?: number[];
  equipes?: number[];
  visao_pessoal?: boolean;
  apenas_pendentes?: boolean;
  pagina?: number;
  ipp?: number;
};

export const usePanoramaPlanoSetorialStore = (prefixo = '') => defineStore(prefixo ? `${prefixo}.panorama` : 'panorama', {
  state: (): Estado => ({
    variaveis: null,
    estatisticasMetas: null,

    listaMetas: null,
    cicloAtual: null,

    chamadasPendentes: {
      variaveis: false,
      estatisticasMetas: false,
      listaMetas: false,
    },

    erros: {
      variaveis: null,
      estatisticasMetas: null,
      listaMetas: null,
    },

    paginacaoDeMetas: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: false,
      totalRegistros: 0,
    },
  }),

  actions: {
    buscarTudo(params:Parametros) {
      this.buscarVariaveis(params);
      this.buscarEstatisticasMetas(params);
      this.buscarListaMetas(params);
    },

    async buscarVariaveis(params:Parametros) {
      this.chamadasPendentes.variaveis = true;
      this.erros.variaveis = null;

      try {
        const { variaveis } = await this.requestS.get(`${baseUrl}/plano-setorial/panorama/tudo-duma-vez-por-enquanto`, params) as PSMFRespostaDashboardDto;

        this.variaveis = variaveis;
      } catch (erro: unknown) {
        this.erros.variaveis = erro;
      }

      this.chamadasPendentes.variaveis = false;
    },

    async buscarEstatisticasMetas(params:Parametros) {
      this.chamadasPendentes.estatisticasMetas = true;
      this.erros.estatisticasMetas = null;

      try {
        const { estatisticas_metas: estatisticasMetas } = await this.requestS.get(`${baseUrl}/plano-setorial/panorama/tudo-duma-vez-por-enquanto`, params) as PSMFRespostaDashboardDto;

        this.estatisticasMetas = estatisticasMetas;
      } catch (erro: unknown) {
        this.erros.estatisticasMetas = erro;
      }

      this.chamadasPendentes.estatisticasMetas = false;
    },

    async buscarListaMetas(params:Parametros) {
      this.chamadasPendentes.listaMetas = true;
      this.erros.listaMetas = null;

      try {
        const {
          lista_metas: {
            itens: listaMetas,
            ciclo_atual: cicloAtual,
            total: totalRegistros,
            pagina: paginaCorrente,
          },
        } = await this.requestS.get(`${baseUrl}/plano-setorial/panorama/tudo-duma-vez-por-enquanto`, params) as PSMFRespostaDashboardDto;

        this.listaMetas = listaMetas;
        this.cicloAtual = cicloAtual;
        this.paginacaoDeMetas.totalRegistros = totalRegistros;
        this.paginacaoDeMetas.paginaCorrente = paginaCorrente;
      } catch (erro: unknown) {
        this.erros.listaMetas = erro;
      }

      this.chamadasPendentes.listaMetas = false;
    },
  },
})();
