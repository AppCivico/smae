import { defineStore } from 'pinia';

// eslint-disable-next-line import/no-extraneous-dependencies
import {
  ListMfDashMetasDto,
} from '@/../../backend/src/mf/metas/dash/dto/metas.dto';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = [];

interface ChamadasPendentes {
  lista: boolean;
}

interface Estado {
  listaDePendentes: ListMfDashMetasDto['pendentes'];
  listaDeAtualizadas: ListMfDashMetasDto['atualizadas'];
  listaDeAtrasadas: ListMfDashMetasDto['atrasadas'];

  perfil: ListMfDashMetasDto['perfil'] | '';

  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
}

type TipoDeLista = 'pendentes' | 'atualizadas' | 'atrasadas';

export const usePanoramaStore = defineStore('panorama', {
  state: (): Estado => ({
    listaDePendentes: [],
    listaDeAtualizadas: [],
    listaDeAtrasadas: [],

    perfil: '',

    chamadasPendentes: {
      // usando `true` por padrão para, em conjunto com o tamanho da lista,
      // identificar se a primeira chamada já ocorreu
      lista: true,
    },

    erro: null,
  }),

  actions: {
    async buscarTudo(pdmId: number, tipoDaLista: TipoDeLista, params = {}): Promise<void> {
      const tipoDeRetorno = {
        retornar_pendentes: false,
        retornar_atualizadas: false,
        retornar_atrasadas: false,
      };

      switch (tipoDaLista) {
        case 'pendentes':
          tipoDeRetorno.retornar_pendentes = true;
          break;
        case 'atualizadas':
          tipoDeRetorno.retornar_atualizadas = true;
          break;
        case 'atrasadas':
          tipoDeRetorno.retornar_atrasadas = true;
          break;

        default:
          throw new Error(`Tipo de lista inválido: \`${tipoDaLista}\``);
      }

      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        const resposta:ListMfDashMetasDto = await this.requestS.get(`${baseUrl}/mf/panorama/metas`, { pdm_id: pdmId, ...params, ...tipoDeRetorno });

        this.perfil = resposta.perfil;

        this.listaDePendentes = [];
        this.listaDeAtualizadas = [];
        this.listaDeAtrasadas = [];

        switch (tipoDaLista) {
          case 'pendentes':
            this.listaDePendentes = Array.isArray(resposta.pendentes)
              ? resposta.pendentes
              : [];
            break;

          case 'atualizadas':
            this.listaDeAtualizadas = Array.isArray(resposta.atualizadas)
              ? resposta.atualizadas
              : [];
            break;

          case 'atrasadas':
            this.listaDeAtrasadas = Array.isArray(resposta.atrasadas)
              ? resposta.atrasadas
              : [];
            break;

          default:
            break;
        }
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },
  },
});
