import { camelCase } from 'lodash';
import type { StoreGeneric } from 'pinia';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  dados: boolean;
  locaisDeProjetos: boolean;
};

type Erros = {
  dados: unknown;
  locaisDeProjetos: unknown;
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

    locaisDeProjetos: [],

    chamadasPendentes: {
      dados: false,
      locaisDeProjetos: false,
    },
    erros: {
      dados: null,
      locaisDeProjetos: null,
    },
  }),
  getters: {
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
      this.chamadasPendentes.locaisDeProjetos = true;

      try {
        // TO-DO: atualizar endpoint
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto`, params);

        this.locaisDeProjetos = linhas;
      } catch (error: unknown) {
        this.erros.locaisDeProjetos = error;
      }
    },
  },
})();
