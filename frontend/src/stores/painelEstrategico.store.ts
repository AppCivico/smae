import { camelCase } from 'lodash';
import type { StoreGeneric } from 'pinia';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  dados: boolean;
};

type Erros = {
  dados: unknown;
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

    chamadasPendentes: {
      dados: false,
    },
    erros: {
      dados: null,
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
  },
})();
