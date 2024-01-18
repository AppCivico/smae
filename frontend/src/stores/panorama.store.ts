import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = [];

interface ChamadasPendentes {
  pendentes: boolean;
  atualizadas: boolean;
  atrasadas: boolean;
}

interface Estado {
  listaDePendentes: [];
  listaDeAtualizadas: [];
  listaDeAtrasadas: [];

  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
}

type TipoDeLista = 'pendentes' | 'atualizadas' | 'atrasadas';

export const usePanoramaStore = defineStore('panorama', {
  state: (): Estado => ({
    listaDePendentes: [],
    listaDeAtualizadas: [],
    listaDeAtrasadas: [],

    chamadasPendentes: {
      pendentes: false,
      atualizadas: false,
      atrasadas: false,
    },

    erro: null,
  }),

  actions: {
    async buscarTudo(tipoDaLista: TipoDeLista, params = {}): Promise<void> {
      if (['pendentes', 'atualizadas', 'atrasadas'].indexOf(tipoDaLista) === -1) {
        throw new Error(`Tipo de lista inválido: \`${tipoDaLista}\``);
      }

      this.chamadasPendentes[tipoDaLista] = true;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/panorama`, params);

        switch (tipoDaLista) {
          case 'pendentes':
            this.listaDePendentes = linhas;
            break;

          case 'atualizadas':
            this.listaDeAtualizadas = linhas;
            break;

          case 'atrasadas':
            this.listaDeAtrasadas = linhas;
            break;

          default:
            break;
        }
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes[tipoDaLista] = false;
    },
  },
});
