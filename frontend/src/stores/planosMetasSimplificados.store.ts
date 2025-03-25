import type {
  DadosCodTituloMetaDto,
  ListDadosMetaIniciativaAtividadesDto,
} from '@back/meta/dto/create-meta.dto';
import type {
  ListProjetoProxyPdmMetaDto,
  ProjetoProxyPdmMetaDto,
} from '@back/pp/projeto/entities/projeto.proxy-pdm-meta.entity';
import { defineStore } from 'pinia';
import type { ArvoreDeIniciativas } from './helpers/mapIniciativas';
import mapIniciativas from './helpers/mapIniciativas';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type PlanosSimplificados = ListProjetoProxyPdmMetaDto['linhas'];
type MetaSimplificada = Omit<DadosCodTituloMetaDto, 'iniciativas'> & {
  iniciativas: ArvoreDeIniciativas;
};

interface ChamadasPendentes {
  planosSimplificados: boolean;
  arvoreDeMetas: boolean;
}

interface Estado {
  planosSimplificados: PlanosSimplificados;
  arvoreDeMetas: { [k: number]: MetaSimplificada };

  chamadasPendentes: ChamadasPendentes;

  erros: {
    arvoreDeMetas: unknown;
    planosSimplificados: unknown;
  };
}

export const usePlanosSimplificadosStore = (prefixo = '') => defineStore(prefixo ? `${prefixo}.planosMetasSimplificados` : 'planosMetasSimplificados', {
  state: (): Estado => ({
    planosSimplificados: [],
    arvoreDeMetas: {},

    chamadasPendentes: {
      planosSimplificados: false,
      arvoreDeMetas: false,
    },
    erros: {
      planosSimplificados: null,
      arvoreDeMetas: null,
    },
  }),

  getters: {
    planosPorId: ({ planosSimplificados }) => planosSimplificados
      .reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur }),
        {} as { [key: number ]: ProjetoProxyPdmMetaDto },
      ),

    planosAgrupadosPorTipo: ({ planosSimplificados }) => {
      const grupos = planosSimplificados.reduce((acc, cur) => {
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
    async buscarPlanos(params = {}): Promise<void> {
      this.chamadasPendentes.planosSimplificados = true;
      this.planosSimplificados = [];
      this.erros.planosSimplificados = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/auxiliar/proxy/pdm-e-metas`, params) as ListProjetoProxyPdmMetaDto;
        this.planosSimplificados = linhas;
      } catch (erro: unknown) {
        this.erros.planosSimplificados = erro;
      }
      this.chamadasPendentes.planosSimplificados = false;
    },

    async buscarArvoreDeMetas(params = {}): Promise<void> {
      this.chamadasPendentes.arvoreDeMetas = true;
      this.erros.arvoreDeMetas = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/auxiliar/proxy/iniciativas-atividades`, params) as ListDadosMetaIniciativaAtividadesDto;

        if (Array.isArray(linhas)) {
          linhas.forEach((cur) => {
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
})();
