import { defineStore } from 'pinia';
import statusObras from '@/consts/statusObras';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  buscandoEndereco: boolean;
  buscandoProximidade: boolean;
};

export type PontoEndereco = {
  camadas: {
    codigo: string;
    cor: null;
    descricao: string;
    id: number;
    nivel_regionalizacao: number;
    titulo: string;
  }[];
  endereco: {
    bbox: number[];
    geometry: {
      coordinates: [number, number];
      type: 'Point';
    };
    geometry_name: unknown;
    properties: {
      bairro: string;
      cep: string;
      cidade: string;
      codigo_pais: string;
      estado: string;
      numero: null;
      osm_type: string;
      pais: string;
      rua: string;
      string_endereco: string;
    };
    type: 'Feature';
  };
};

type LocalizacaoProximidade = {
  lat: number;
  lon: number;
  geo_camada_codigo: string;
  // regiao_id: 0;
};

type Estado = {
  selecionado: any;
  enderecos: any[];
  erro: ChamadasPendentes;
  chamadasPendentes: ChamadasPendentes;
  proximidade: Record<string, any>;
};

export const LegendasStatus = {
  obras: { item: 'Monitoramento de Obras', color: '#8EC122' },
  projetos: { item: 'Gestão de Projetos', color: '#F2890D' },
  metas: { item: 'Programa de Metas', color: '#4074BF' },
  plenoSetorial: { item: 'Planos Setoriais', color: '#9F045F' },
};

const chamadasPendentesPadrao: ChamadasPendentes = {
  buscandoEndereco: false,
  buscandoProximidade: false,
};

export const useGeolocalizadorStore = defineStore('geolocalizador', {
  state: (): Estado => ({
    selecionado: {},
    enderecos: [],
    erro: { ...chamadasPendentesPadrao },
    chamadasPendentes: { ...chamadasPendentesPadrao },
    proximidade: {},
  }),
  actions: {
    async buscarPorEndereco(termo: string) {
      try {
        this.erro.buscandoEndereco = false;
        this.chamadasPendentes.buscandoEndereco = true;

        const { linhas } = await this.requestS.post(`${baseUrl}/geolocalizar`, {
          tipo: 'Endereco',
          busca_endereco: termo,
        });

        this.enderecos = linhas ?? [];
      } catch (erro) {
        this.erro.buscandoEndereco = true;

        throw erro;
      } finally {
        this.chamadasPendentes.buscandoEndereco = false;
      }
    },
    async buscarPorCoordenadas(lat: number, long: number) {
      try {
        this.erro.buscandoEndereco = false;
        this.chamadasPendentes.buscandoEndereco = true;

        const { linhas } = await this.requestS.post(
          `${baseUrl}/geolocalizar-reverso`,
          {
            tipo: 'Endereco',
            lat,
            long,
          },
        );

        this.enderecos = linhas;
      } catch (erro) {
        this.erro.buscandoEndereco = true;

        throw erro;
      } finally {
        this.chamadasPendentes.buscandoEndereco = false;
      }
    },
    async buscaProximidades(localizacaoProximidade: LocalizacaoProximidade) {
      try {
        this.erro.buscandoProximidade = false;
        this.chamadasPendentes.buscandoProximidade = true;

        const proximidade = await this.requestS.post(
          `${baseUrl}/busca-proximidades`,
          {
            lat: localizacaoProximidade.lat,
            lon: localizacaoProximidade.lon,
            raio_km: 2,
            // geo_camada_config_id: 0,
            // geo_camada_codigo: localizacaoProximidade.geo_camada_codigo,
            // regiao_id: 0,
          },
        );

        this.proximidade = proximidade as any;

        return proximidade;
      } catch (erro) {
        this.erro.buscandoProximidade = true;

        throw erro;
      } finally {
        this.chamadasPendentes.buscandoProximidade = false;
      }
    },
    selecionarEndereco(endereco) {
      this.selecionado = endereco;
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
          let dadosParciais: any = {};
          switch (chave) {
            case 'obras':
              dadosParciais = {
                cor: 'verde',
                nome: registro.nome,
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
                nome: registro.nome,
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

          const item = {
            ...dadosParciais,
            id: registro.id,
            modulo: chave,
            localizacoes: registro.localizacoes,
          } as any;

          for (let i = 0; i < item.localizacoes.length; i += 1) {
            item.localizacoes[i].geom_geojson.properties.cor_do_marcador = dadosParciais.cor;
          }

          agrupado.push(item);
        });

        return agrupado;
      }, [] as any[]);

      return dadosOrganizados;
    },
  },
});
