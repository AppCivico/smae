import statusObras from '@/consts/statusObras';
import type { DotacaoBuscaResponseDto } from '@back/dotacao-busca/dto/dotacao-busca.dto';
import type {
  EtapaSearchResultDto,
  MetaIniAtvLookupInfoDto,
  PdmRotuloInfo,
  ProjetoSearchResultDto,
  SearchEntitiesNearbyResponseDto,
} from '@back/geo-busca/dto/geo-busca.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  proximidadePorLocalizacao: boolean;
  buscaDotacao: boolean;
};

type Erros = {
  proximidadePorLocalizacao: null | unknown;
  buscaDotacao: null | unknown;
};

type Estado = {
  dadosPorGeo: SearchEntitiesNearbyResponseDto | null;
  dadosPorDotacao: DotacaoBuscaResponseDto | null;
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
  dotacoes_encontradas?: unknown;

  meta_info?: MetaIniAtvLookupInfoDto;
  iniciativa_info?: MetaIniAtvLookupInfoDto;
  atividade_info?: MetaIniAtvLookupInfoDto;
  pdm_info?: PdmRotuloInfo;
};

export const LegendasStatus = {
  obras: { item: 'Monitoramento de Obras', color: '#8EC122' },
  projetos: { item: 'Gestão de Projetos', color: '#F2890D' },
  programaDeMetas: { item: 'Programa de Metas', color: '#4074BF' },
  planoSetorial: { item: 'Planos Setoriais', color: '#9F045F' },
};

export const useEntidadesProximasStore = defineStore('entidadesProximas', {
  state: (): Estado => ({
    dadosPorGeo: null,
    dadosPorDotacao: null,
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
    async buscarPorLocalizacao(localizacaoProximidade: LocalizacaoProximidade, raio = 2000) {
      try {
        this.erro.proximidadePorLocalizacao = false;
        this.chamadasPendentes.proximidadePorLocalizacao = true;

        const resposta = await this.requestS.post(
          `${baseUrl}/busca-proximidades`,
          {
            lat: localizacaoProximidade.lat,
            lon: localizacaoProximidade.lon,
            raio,
          },
        ) as SearchEntitiesNearbyResponseDto;

        this.dadosPorGeo = resposta;

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
        ) as DotacaoBuscaResponseDto;

        this.dadosPorDotacao = resposta;

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
    entidadesPorDotacao({ dadosPorDotacao }) {
      if (!dadosPorDotacao || Object.keys(dadosPorDotacao).length === 0) {
        return [];
      }
    },
    entidadesPorProximidade({ dadosPorGeo }) {
      if (!dadosPorGeo || Object.keys(dadosPorGeo).length === 0) {
        return [];
      }

      const gruposSelecionados = [
        'obras',
        'projetos',
        'etapas',
      ] as const;

      const dadosOrganizados = gruposSelecionados.reduce((agrupado, chave) => {
        type Grupo = (EtapaSearchResultDto | ProjetoSearchResultDto)[] | undefined;
        // eslint-disable-next-line max-len
        const grupo: Grupo = (dadosPorGeo[chave as keyof SearchEntitiesNearbyResponseDto] || undefined);

        if (!grupo || grupo.length === 0) {
          return agrupado;
        }

        grupo.forEach((registro) => {
          let dadosParciais: Partial<ItemProximidadeFormatado> = {
            id: registro.id,
            modulo: chave,
            nome: '',
            cor: 'padrao',
          };

          switch (chave) {
            case 'obras': {
              const obra = registro as ProjetoSearchResultDto;

              dadosParciais = {
                ...dadosParciais,
                nome: obra.nome ?? '',
                cor: LegendasStatus.obras.color,
                portfolio_programa: obra.portfolio_titulo || '',
                orgao: obra.orgao_responsavel_sigla || '',
                nro_vinculos: Number(obra.nro_vinculos ?? 0),
                status: obra.status ? {
                  valor: obra.status,
                  nome: statusObras[obra.status as keyof typeof statusObras]?.nome
                    || obra.status,
                } : undefined,
                detalhes: {
                  'Grupo Temático': obra.grupo_tematico_nome,
                  'Tipo de obra/Intervenção': obra.tipo_intervencao_nome,
                  'Equipamento/Estrutura Pública': obra.equipamento_nome,
                  Subprefeitura: obra.subprefeitura_nomes,
                },
              };
              break;
            }

            case 'projetos': {
              const projeto = registro as ProjetoSearchResultDto;

              dadosParciais = {
                ...dadosParciais,
                nome: projeto.nome ?? '',
                cor: LegendasStatus.projetos.color,
                portfolio_programa: projeto.portfolio_titulo || '',
                orgao: projeto.orgao_responsavel_sigla || '',
                nro_vinculos: Number(projeto.nro_vinculos ?? 0),
                status: projeto.status ? {
                  valor: projeto.status,
                  nome: projeto.status,
                } : undefined,
              };

              break;
            }

            case 'etapas': {
              const etapa = registro as EtapaSearchResultDto;

              if (etapa.meta_id) {
                const metaInfo = this.metasInfo?.[etapa.meta_id ?? 0];
                let pdmInfo;

                if (metaInfo) {
                  dadosParciais.nome = metaInfo.titulo;
                  dadosParciais.meta_info = metaInfo;
                  dadosParciais.nro_vinculos = Number(metaInfo.nro_vinculos ?? 0);
                  dadosParciais.orgao = metaInfo.orgaos_sigla?.join(', ') || '';

                  pdmInfo = metaInfo?.pdm_id ? this.pdmInfo?.[metaInfo.pdm_id] : undefined;

                  if (pdmInfo) {
                    dadosParciais.pdm_info = pdmInfo;
                    dadosParciais.portfolio_programa = pdmInfo.nome || '';

                    if (['PDM', 'ProgramaDeMetas'].indexOf(pdmInfo.sistema) > -1) {
                      dadosParciais.cor = LegendasStatus.programaDeMetas.color;
                    } else if (pdmInfo.sistema === 'PlanoSetorial') {
                      dadosParciais.cor = LegendasStatus.planoSetorial.color;
                    }
                  }
                }

                if (etapa.iniciativa_id) {
                  const iniciativaInfo = this.iniciativasInfo?.[etapa.iniciativa_id ?? 0];

                  if (iniciativaInfo) {
                    dadosParciais.iniciativa_info = iniciativaInfo;
                    dadosParciais.orgao = iniciativaInfo.orgaos_sigla?.join(', ') || '';
                    dadosParciais.nro_vinculos = Number(iniciativaInfo.nro_vinculos ?? 0);

                    dadosParciais.detalhes = {
                      [pdmInfo?.rotulo_iniciativa || 'Iniciativa']: iniciativaInfo.titulo,
                    };
                  }

                  if (etapa.atividade_id) {
                    const atividadeInfo = this.atividadesInfo?.[etapa.atividade_id ?? 0];
                    if (atividadeInfo) {
                      dadosParciais.atividade_info = atividadeInfo;
                      dadosParciais.orgao = atividadeInfo.orgaos_sigla?.join(', ') || '';
                      dadosParciais.nro_vinculos = Number(atividadeInfo.nro_vinculos ?? 0);

                      if (dadosParciais.detalhes) {
                        dadosParciais.detalhes[pdmInfo?.rotulo_atividade || 'Atividade'] = atividadeInfo.titulo;
                      } else {
                        dadosParciais.detalhes = {
                          [pdmInfo?.rotulo_atividade || 'Atividade']: atividadeInfo.titulo,
                        };
                      }
                    }
                  }
                }
              }

              break;
            }

            default:
              break;
          }

          const localizacoesComCor = (registro.localizacoes ?? []).map(
            (localizacao) => ({
              ...localizacao,
              geom_geojson: {
                ...localizacao.geom_geojson,
                properties: {
                  ...localizacao.geom_geojson.properties,
                  cor_do_marcador: dadosParciais.cor,
                },
              },
            }),
          ) || [];

          if ('dotacoes_encontradas' in registro) {
            dadosParciais.dotacoes_encontradas = registro.dotacoes_encontradas;
          }

          const item = {
            ...dadosParciais,
            localizacoes: localizacoesComCor,
          } as ItemProximidadeFormatado;

          agrupado.push(item);
        });

        return agrupado;
      }, [] as ItemProximidadeFormatado[]);

      return dadosOrganizados;
    },
    // eslint-disable-next-line max-len
    metasInfo: ({ dadosPorGeo }): Record<string, MetaIniAtvLookupInfoDto> | null => (!dadosPorGeo?.metas_info
      ? null
      : dadosPorGeo.metas_info
        .reduce((acc: Record<string, MetaIniAtvLookupInfoDto>, cur: MetaIniAtvLookupInfoDto) => {
          acc[cur.id] = cur;
          return acc;
        }, {})),
    iniciativasInfo: ({ dadosPorGeo }) => (!dadosPorGeo?.iniciativas_info
      ? null
      : dadosPorGeo.iniciativas_info
        .reduce((acc: Record<string, MetaIniAtvLookupInfoDto>, cur: MetaIniAtvLookupInfoDto) => {
          acc[cur.id] = cur;
          return acc;
        }, {})),
    atividadesInfo: ({ dadosPorGeo }) => (!dadosPorGeo?.atividades_info
      ? null
      : dadosPorGeo.atividades_info
        .reduce((acc: Record<string, MetaIniAtvLookupInfoDto>, cur: MetaIniAtvLookupInfoDto) => {
          acc[cur.id] = cur;
          return acc;
        }, {})),
    pdmInfo: ({ dadosPorGeo }): Record<string, PdmRotuloInfo> | null => (!dadosPorGeo?.pdm_info
      ? null
      : dadosPorGeo.pdm_info
        .reduce((acc: Record<string, PdmRotuloInfo>, cur: PdmRotuloInfo) => {
          acc[cur.id] = cur;
          return acc;
        }, {})),
  },
});
