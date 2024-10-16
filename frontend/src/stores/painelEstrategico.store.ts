import { camelCase } from 'lodash';
import type { StoreGeneric } from 'pinia';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  dados: boolean;
  projetosParaMapa: boolean;
  projetosPaginados: boolean;
};

type Erros = {
  dados: unknown;
  projetosParaMapa: unknown;
  projetosPaginados: unknown;
};

type Estado = Record<string, unknown> & {
  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
  paginacaoProjetos: {
    tokenPaginacao: string;
    paginas: number;
    paginaCorrente: number;
    temMais: boolean;
    totalRegistros: number;
  };
};

export const usePainelEstrategicoStore = (prefixo: string): StoreGeneric => defineStore(prefixo ? `${prefixo}.painelEstrategico` : 'painelEstrategico', {
  state: (): Estado => ({
    anosMapaCalorConcluidos: [],
    anosMapaCalorPlanejados: [],
    grandesNumeros: { },
    projetoEtapas: [],
    projetoOrgaoResponsavel: [],
    projetoStatus: [],
    projetosConcluidosAno: [],
    projetosConcluidosMes: [],
    projetosPlanejadosAno: [],
    projetosPlanejadosMes: [],
    quantidadesProjeto: [],
    resumoOrcamentario: [],
    projetosParaMapa: [],
    totalRegistrosRevisadosProjetos: 0,
    chamadasPendentes: {
      dados: false,
      projetosParaMapa: false,
      projetosPaginados: false,
    },
    erros: {
      dados: null,
      projetosParaMapa: null,
      projetosPaginados: null,
    },
    // lista de projetos paginados
    projetosPaginados: [],
    paginacaoProjetos: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: true,
      totalRegistros: 0,
    },
  }),
  getters: {
    locaisAgrupados: ({ projetosParaMapa }) => projetosParaMapa
      .reduce((acc, cur) => {
        if (Array.isArray(cur.geolocalizacao)) {
          cur.geolocalizacao.forEach((geolocalizacao) => {
            if (geolocalizacao.endereco) {
              acc.enderecos.push(geolocalizacao.endereco);
            }
            if (geolocalizacao.camadas) {
              acc.camadas = acc.camadas.concat(geolocalizacao.camadas);
            }
          });
        }

        return acc;
      }, {
        camadas: [],
        enderecos: [],
      }),
  },
  actions: {
    async buscarDados(params = {}): Promise<void> {
      this.chamadasPendentes.dados = true;
      this.erros.dados = null;
      try {
        const resposta = await this.requestS.post(`${baseUrl}/painel-estrategico`, params);

        Object.keys(resposta).forEach((chave) => {
          const chaveConvertida = camelCase(chave);

          if (this[chaveConvertida]) {
            this[chaveConvertida] = resposta[chave];
          }
        });
      } catch (erro: unknown) {
        this.erros.dados = erro;
      }
      this.chamadasPendentes.dados = false;
    },

    async buscarProjetosParaMapa(params = {}): Promise<void> {
      this.chamadasPendentes.projetosParaMapa = true;
      this.erros.projetosParaMapa = null;

      try {
        // TO-DO: atualizar endpoint
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto`, params);

        this.projetosParaMapa = linhas;
      } catch (error: unknown) {
        this.erros.projetosParaMapa = error;
      }
    },

    async buscarProjetos(params = {}): Promise<void> {
      this.chamadasPendentes.projetosPaginados = true;
      this.erros.projetosPaginados = null;

      try {
        const {
          linhas,
          total_registros_revisados: totalRegistrosRevisados,
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.post(`${baseUrl}/painel-estrategico/lista-projeto-paginado`, params);
        this.projetosPaginados = linhas;
        this.totalRegistrosRevisadosProjetos = totalRegistrosRevisados;

        this.paginacaoProjetos.tokenPaginacao = tokenPaginacao;
        this.paginacaoProjetos.paginas = paginas;
        this.paginacaoProjetos.paginaCorrente = paginaCorrente;
        this.paginacaoProjetos.temMais = temMais;
        this.paginacaoProjetos.totalRegistros = totalRegistros;
      } catch (erro: unknown) {
        this.erros.projetosPaginados = erro;
      }
      this.chamadasPendentes.projetosPaginados = false;
    },
  },
})();
