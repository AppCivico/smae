import { defineStore } from 'pinia';
import statusObras from '@/consts/statusObras';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  proximidadePorLocalizacao: boolean;
  buscaDotacao: boolean;
};

type Erros = {
  proximidadePorLocalizacao: null | unknown;
  buscaDotacao: null | unknown;
};

type EntidadeProxima = {
  id: number;
  nome: string;
  modulo: string;
  distancia_km?: number;
  [key: string]: unknown;
};

type Estado = {
  lista: Record<string, EntidadeProxima[]>;
  erro: Erros;
  chamadasPendentes: ChamadasPendentes;
};

type LocalizacaoGeoJSON = {
  geom_geojson: {
    properties: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type LocalizacaoProximidade = {
  lat: number;
  lon: number;
  geo_camada_codigo: string;
};

type ItemProximidadeFormatado = {
  id: number;
  modulo: string;
  nome: string;
  nro_vinculos: number;
  localizacoes: LocalizacaoGeoJSON[];
  cor: string;
  portfolio_programa?: string;
  orgao?: string;
  status?: {
    valor: string;
    nome: string;
  };
  detalhes?: Record<string, string | null | undefined>;
};

export const LegendasStatus = {
  obras: { item: 'Monitoramento de Obras', color: '#8EC122' },
  projetos: { item: 'Gestão de Projetos', color: '#F2890D' },
  metas: { item: 'Programa de Metas', color: '#4074BF' },
  plenoSetorial: { item: 'Planos Setoriais', color: '#9F045F' },
};

export const useEntidadesProximasStore = defineStore('entidadesProximas', {
  state: (): Estado => ({
    lista: {},
    erro: {
      proximidadePorLocalizacao: null,
      buscaDotacao: null,
    },
    chamadasPendentes: {
      proximidadePorLocalizacao: false,
      buscaDotacao: false,
    },
  }),
  actions: {
    async buscarPorLocalizacao(localizacaoProximidade: LocalizacaoProximidade) {
      try {
        this.erro.proximidadePorLocalizacao = false;
        this.chamadasPendentes.proximidadePorLocalizacao = true;

        const resposta = await this.requestS.post(
          `${baseUrl}/busca-proximidades`,
          {
            lat: localizacaoProximidade.lat,
            lon: localizacaoProximidade.lon,
            raio_km: 2,
          },
        );

        this.lista = resposta as Record<string, EntidadeProxima[]>;

        return resposta;
      } catch (erro) {
        this.erro.proximidadePorLocalizacao = true;

        throw erro;
      } finally {
        this.chamadasPendentes.proximidadePorLocalizacao = false;
      }
    },
    async buscarPorDotacao(dotacao: string) {
      try {
        this.erro.buscaDotacao = false;
        this.chamadasPendentes.buscaDotacao = true;

        const resposta = await this.requestS.get(
          `${baseUrl}/dotacao-busca`,
          {
            query: dotacao,
          },
        );

        this.lista = resposta as Record<string, EntidadeProxima[]>;

        return resposta;
      } catch (erro) {
        this.erro.buscaDotacao = true;

        throw erro;
      } finally {
        this.chamadasPendentes.buscaDotacao = false;
      }
    },
  },
  getters: {
    proximidadeFormatada({ proximidade }) {
      if (Object.keys(proximidade).length === 0) {
        return [];
      }

      const gruposSelecionados = ['projetos', 'obras', 'metas'] as const;
      const dadosOrganizados = gruposSelecionados.reduce((agrupado, chave) => {
        const grupo = (proximidade[chave] as any[]) || undefined;
        if (!grupo || grupo.length === 0) {
          return agrupado;
        }

        grupo.forEach((registro) => {
          let dadosParciais: Partial<ItemProximidadeFormatado> = {};
          switch (chave) {
            case 'obras':
              dadosParciais = {
                cor: 'verde',
                portfolio_programa: registro.portfolio_titulo,
                orgao: registro.orgao_responsavel_sigla,
                status: {
                  valor: registro.status,
                  nome: statusObras[registro.status]?.nome || registro.status,
                },
                detalhes: {
                  'Grupo Temático': registro.grupo_tematico_nome,
                  'Tipo de obra/Intervenção': registro.tipo_intervencao_nome,
                  'Equipamento/Estrutura Pública': registro.equipamento_nome,
                  Subprefeitura: registro.subprefeitura_nomes,
                },
              };
              break;

            case 'projetos':
              dadosParciais = {
                cor: 'laranja',
                portfolio_programa: registro.portfolio_titulo,
                orgao: registro.orgao_responsavel_sigla,
                status: {
                  valor: registro.status,
                  nome: registro.status,
                },
              };

              break;

            default:
              break;
          }

          const corItem = dadosParciais.cor ?? 'padrao';

          const localizacoesComCor = (registro.localizacoes ?? []).map(
            (localizacao: LocalizacaoGeoJSON) => ({
              ...localizacao,
              geom_geojson: {
                ...localizacao.geom_geojson,
                properties: {
                  ...localizacao.geom_geojson.properties,
                  cor_do_marcador: corItem,
                },
              },
            }),
          ) || [];

          const item: ItemProximidadeFormatado = {
            ...dadosParciais,
            dotacoes_encontradas: registro.dotacoes_encontradas,
            id: registro.id,
            modulo: chave,
            nome: registro.nome ?? '',
            nro_vinculos: Number(registro.nro_vinculos ?? 0),
            localizacoes: localizacoesComCor,
            cor: corItem,
          };

          agrupado.push(item);
        });

        return agrupado;
      }, [] as ItemProximidadeFormatado[]);

      return dadosOrganizados;
    },
  },
});
