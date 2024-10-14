import { camelCase } from 'lodash';
import type { StoreGeneric } from 'pinia';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  dados: boolean;
  projetosParaMapa: boolean;
};

type Erros = {
  dados: unknown;
  projetosParaMapa: unknown;
};

type Estado = Record<string, unknown> & {
  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
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

    chamadasPendentes: {
      dados: false,
      projetosParaMapa: false,
    },
    erros: {
      dados: null,
      projetosParaMapa: null,
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

      try {
        const { linhas } = await this.requestS.post(`${baseUrl}/painel-estrategico/geo-localizacao`, params);

        this.projetosParaMapa = linhas;
      } catch (error: unknown) {
        this.erros.projetosParaMapa = error;
      }
    },
  },
})();
