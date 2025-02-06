import { jwtDecode } from 'jwt-decode';
import { camelCase } from 'lodash';
import type { StoreGeneric } from 'pinia';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  dados: boolean;
  projetosParaMapa: boolean;
  projetosPaginados: boolean;
  orcamentosPaginados: boolean;
};

type Erros = {
  dados: unknown;
  projetosParaMapa: unknown;
  projetosPaginados: unknown;
  orcamentosPaginados: unknown;
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
    validoAte: number;
  };
  paginacaoOrcamentos: {
    tokenPaginacao: string;
    paginas: number;
    paginaCorrente: number;
    temMais: boolean;
    totalRegistros: number;
    validoAte: number;
  };
};

export const usePainelEstrategicoStore = (prefixo: string): StoreGeneric => defineStore(prefixo ? `${prefixo}.painelEstrategico` : 'painelEstrategico', {
  state: (): Estado => ({
    anosMapaCalorConcluidos: [],
    anosMapaCalorPlanejados: [],
    execucaoOrcamentariaAno: [],
    grandesNumeros: {},
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
    chamadasPendentes: {
      dados: false,
      projetosParaMapa: false,
      projetosPaginados: false,
      orcamentosPaginados: false,
    },
    erros: {
      dados: null,
      projetosParaMapa: null,
      projetosPaginados: null,
      orcamentosPaginados: null,
    },
    // lista de projetos paginados
    projetosPaginados: [],
    paginacaoProjetos: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: true,
      totalRegistros: 0,
      validoAte: 0,
    },
    // lista de orcamentos paginados
    orcamentosPaginados: [],
    paginacaoOrcamentos: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: true,
      totalRegistros: 0,
      validoAte: 0,
    },
  }),
  getters: {
    locaisAgrupados: ({ projetosParaMapa }) => projetosParaMapa
      .reduce((acc, cur) => {
        if (Array.isArray(cur.geolocalizacao) && cur.geolocalizacao.length) {
          cur.geolocalizacao.forEach((geolocalizacao) => {
            let subPrefeitura = '';

            if (geolocalizacao.camadas) {
              acc.camadas = acc.camadas.concat(geolocalizacao.camadas);

              subPrefeitura = geolocalizacao.camadas
                .find((camada) => camada.nivel_regionalizacao === 3)?.titulo;

              if (subPrefeitura) {
                subPrefeitura = `<i>${subPrefeitura}</i>`;
              }
            }

            if (geolocalizacao.endereco) {
              acc.enderecos.push(geolocalizacao.endereco);
              const rotulo = cur.projeto_nome;
              const descricao = [subPrefeitura, cur.projeto_status, cur.projeto_etapa].join('<br/>');

              if (rotulo) {
                acc.enderecos[acc.enderecos.length - 1].properties.rotulo = rotulo;
              }

              if (descricao) {
                acc.enderecos[acc.enderecos.length - 1].properties.descricao = descricao;
              }
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
        const { linhas } = await this.requestS.post(`${baseUrl}/painel-estrategico/geo-localizacao`, params);

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
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.post(`${baseUrl}/painel-estrategico/lista-projeto-paginado`, params);
        this.projetosPaginados = linhas;
        this.paginacaoProjetos.tokenPaginacao = tokenPaginacao;
        this.paginacaoProjetos.paginas = paginas;
        this.paginacaoProjetos.paginaCorrente = paginaCorrente;
        this.paginacaoProjetos.temMais = temMais;
        this.paginacaoProjetos.totalRegistros = totalRegistros;

        if (!params.pagina || params.pagina === 1) {
          try {
            const { exp, iat } = jwtDecode(tokenPaginacao);

            if (exp && iat) {
              this.paginacaoProjetos.validoAte = Date.now() + (exp - iat);
            }
          } catch (erro) {
            this.erros.projetosPaginados = erro;
          }
        }
      } catch (erro: unknown) {
        this.erros.projetosPaginados = erro;
      }
      this.chamadasPendentes.projetosPaginados = false;
    },

    async buscarOrcamentos(params = {}): Promise<void> {
      this.chamadasPendentes.orcamentosPaginados = true;
      this.erros.orcamentosPaginados = null;

      try {
        const {
          linhas,
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.post(`${baseUrl}/painel-estrategico/lista-execucao-orcamentaria`, params);
        this.orcamentosPaginados = linhas;
        this.paginacaoOrcamentos.tokenPaginacao = tokenPaginacao;
        this.paginacaoOrcamentos.paginas = paginas;
        this.paginacaoOrcamentos.paginaCorrente = paginaCorrente;
        this.paginacaoOrcamentos.temMais = temMais;
        this.paginacaoOrcamentos.totalRegistros = totalRegistros;

        if (!params.pagina || params.pagina === 1) {
          try {
            const { exp, iat } = jwtDecode(tokenPaginacao);

            if (exp && iat) {
              this.paginacaoOrcamentos.validoAte = Date.now() + (exp - iat);
            }
          } catch (erro) {
            this.erros.orcamentosPaginados = erro;
          }
        }
      } catch (erro: unknown) {
        this.erros.orcamentosPaginados = erro;
      }
      this.chamadasPendentes.orcamentosPaginados = false;
    },
  },
})();
