import type {
  DadosCodTituloMetaDto,
  ListDadosMetaIniciativaAtividadesDto,
} from '@/../../backend/src/meta/dto/create-meta.dto';
import type {
  ListProjetoProxyPdmMetaDto,
  ProjetoProxyPdmMetaDto,
} from '@/../../backend/src/pp/projeto/entities/projeto.proxy-pdm-meta.entity';
import { defineStore } from 'pinia';
import mapIniciativas from './helpers/mapIniciativas';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type PdmsSimplificados = ListProjetoProxyPdmMetaDto['linhas'];
type MetaSimplificada = ListDadosMetaIniciativaAtividadesDto['linhas'];

interface ChamadasPendentes {
  pdmsSimplificados: boolean;
  arvoreDeMetas: boolean;
}

interface Estado {
  pdmsSimplificados: PdmsSimplificados;
  arvoreDeMetas: { [k: number]: MetaSimplificada };

  chamadasPendentes: ChamadasPendentes;

  erros: {
    arvoreDeMetas: unknown;
    pdmsSimplificados: unknown;
  };
}

export const usePdmMetasStore = defineStore('pdmMetas', {
  state: (): Estado => ({
    pdmsSimplificados: [],
    arvoreDeMetas: {},

    chamadasPendentes: {
      pdmsSimplificados: false,
      arvoreDeMetas: false,
    },
    erros: {
      pdmsSimplificados: null,
      arvoreDeMetas: null,
    },
  }),

  getters: {
    pdmsPorId: ({ pdmsSimplificados }) => pdmsSimplificados
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    planosAgrupadosPorTipo: ({ pdmsSimplificados }) => {
      const grupos = pdmsSimplificados.reduce((acc, cur) => {
        if (!acc[cur.tipo]) {
          acc[cur.tipo] = [];
        }
        acc[cur.tipo].push(cur);
        return acc;
      }, {} as { [key: string]: ProjetoProxyPdmMetaDto[] });

      const chaves = Object.keys(grupos).sort((a, b) => a.localeCompare(b));
      let i = 0;
      const resultado: { [key: string]: ProjetoProxyPdmMetaDto[] } = {};

      while (i < chaves.length) {
        const chave = chaves[i];
        resultado[chave] = grupos[chave]
          .sort((a:ProjetoProxyPdmMetaDto, b:ProjetoProxyPdmMetaDto) => a.nome
            .localeCompare(b.nome));
        i += 1;
      }

      return resultado;
    },
  },
  actions: {
    async buscarPdms(params = {}): Promise<void> {
      this.chamadasPendentes.pdmsSimplificados = true;
      this.pdmsSimplificados = [];
      this.erros.pdmsSimplificados = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/auxiliar/proxy/pdm-e-metas`, params);
        this.pdmsSimplificados = linhas;
      } catch (erro: unknown) {
        this.erros.pdmsSimplificados = erro;
      }
      this.chamadasPendentes.pdmsSimplificados = false;
    },

    async buscarArvoreDeMetas(params = {}): Promise<void> {
      this.chamadasPendentes.arvoreDeMetas = true;
      this.erros.arvoreDeMetas = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/auxiliar/proxy/iniciativas-atividades`, params);

        if (Array.isArray(linhas)) {
          linhas.forEach((cur:DadosCodTituloMetaDto) => {
            this.arvoreDeMetas[cur.id] = {
              ...cur,
              iniciativas: mapIniciativas(cur.iniciativas),
            };
          });
        }
      } catch (erro: unknown) {
        this.erros.arvoreDeMetas = erro;
      }
      this.chamadasPendentes.arvoreDeMetas = false;
    },
  },
});
