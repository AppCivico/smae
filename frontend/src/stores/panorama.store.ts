import type { IdCodTituloDto } from '@back/common/dto/IdCodTitulo.dto';
import type { IdTituloOrNullDto } from '@back/common/dto/IdTitulo.dto';
import type { ListMetaDto } from '@back/meta/dto/list-meta.dto';
import type { ListMfDashEtapaHierarquiaDto, ListMfDashMetasDto } from '@back/mf/metas/dash/dto/metas.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  filtro: boolean;
  lista: boolean;
  ancestrais: boolean;
};

type Estado = {
  listaDePendentes: ListMfDashMetasDto['pendentes'];
  listaDeAtualizadas: ListMfDashMetasDto['atualizadas'];
  listaDeAtrasadas: ListMfDashMetasDto['atrasadas'];
  listaDeAtrasadasComDetalhes: ListMfDashMetasDto['atrasadas_detalhes'];

  dadosParaFiltro: ListMetaDto['linhas'];

  ancestraisPorEtapa: {
    [key:string]: ListMfDashEtapaHierarquiaDto['linhas'][0];
  };

  tarefasPorId: {
    [key: string]: IdTituloOrNullDto;
  };
  variáveisPorId: {
    [key: string]: IdCodTituloDto;
  };

  perfil: ListMfDashMetasDto['perfil'] | '';

  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
};

type TipoDeLista = 'pendentes' | 'atualizadas' | 'atrasadas';

type Parâmetros = {
  retornar_detalhes?: boolean;
  metas?: number | number[];
  coordenadores_cp?: number | number[];
  orgaos?: number | number[];
  visao_geral?: boolean;
};

export const usePanoramaStore = defineStore('panorama', {
  state: (): Estado => ({
    listaDePendentes: [],
    listaDeAtualizadas: [],
    listaDeAtrasadas: [],
    listaDeAtrasadasComDetalhes: [],

    dadosParaFiltro: [],

    ancestraisPorEtapa: {},

    tarefasPorId: {},
    variáveisPorId: {},

    perfil: '',

    chamadasPendentes: {
      lista: false,
      filtro: true,
      ancestrais: true,
    },

    erro: null,
  }),

  actions: {
    async buscarAncestraisDeEtapas(idsDeEtapas = []) {
      this.chamadasPendentes.ancestrais = true;
      this.erro = null;

      try {
        const { linhas }:ListMfDashEtapaHierarquiaDto = await this.requestS.get(`${baseUrl}/mf/panorama/etapa-hierarquia`, { etapas_ids: idsDeEtapas.length ? idsDeEtapas : undefined });

        if (Array.isArray(linhas)) {
          linhas.forEach((x) => {
            if (!this.ancestraisPorEtapa[x.etapa_id]) {
              this.ancestraisPorEtapa[x.etapa_id] = { ...x };
            }
          });
        } else {
          throw new Error('Propriedade `linhas` não é um array!');
        }
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.ancestrais = false;
    },

    async buscarFiltro(params = {}) {
      this.chamadasPendentes.filtro = true;
      this.erro = null;

      try {
        const { linhas }:ListMetaDto = await this.requestS.get(`${baseUrl}/mf/panorama/filtros-metas`, params);

        if (Array.isArray(linhas)) {
          this.dadosParaFiltro = linhas;
        } else {
          throw new Error('Propriedade `linhas` não é um array!');
        }
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.filtro = false;
    },

    async buscarTudo(
      pdmId: number,
      tipoDaLista: TipoDeLista,
      params:Parâmetros = {},
    ): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
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

        const resposta:ListMfDashMetasDto = await this.requestS.get(`${baseUrl}/mf/panorama/metas`, { pdm_id: pdmId, ...params, ...tipoDeRetorno });

        this.perfil = resposta.perfil;

        let lista:ListMfDashMetasDto['pendentes'] | ListMfDashMetasDto['atualizadas'] = [];

        switch (true) {
          case tipoDaLista === 'pendentes':
            if (Array.isArray(resposta.pendentes)) {
              this.listaDePendentes = resposta.pendentes;
              lista = resposta.pendentes;
            } else {
              throw new Error('Propriedade `pendentes` não é um array!');
            }
            break;

          case tipoDaLista === 'atualizadas':
            if (Array.isArray(resposta.atualizadas)) {
              this.listaDeAtualizadas = resposta.atualizadas;
              lista = resposta.atualizadas;
            } else {
              throw new Error('Propriedade `atualizadas` não é um array!');
            }
            break;

          case tipoDaLista === 'atrasadas' && params.retornar_detalhes:
            if (Array.isArray(resposta.atrasadas_detalhes)) {
              this.listaDeAtrasadasComDetalhes = resposta.atrasadas_detalhes;
            } else {
              throw new Error('Propriedade `atrasadas_detalhes` não é um array!');
            }
            break;

          case tipoDaLista === 'atrasadas':
            if (Array.isArray(resposta.atrasadas)) {
              this.listaDeAtrasadas = resposta.atrasadas;
            } else {
              throw new Error('Propriedade `atrasadas` não é um array!');
            }
            break;

          default:
            break;
        }

        lista.forEach((meta) => {
          if (Array.isArray(meta.cronograma?.detalhes)) {
            meta.cronograma.detalhes.forEach((tarefa:IdTituloOrNullDto) => {
              if (!this.tarefasPorId[tarefa.id]) {
                // usando cópias para evitar que uma nova chamada à API apague
                // uma referência usada em alguma outra situação. Não deve
                // acontecer, mas... Who knows?
                this.tarefasPorId[tarefa.id] = { ...tarefa };
              }
            });
          }
          if (Array.isArray(meta.variaveis?.detalhes)) {
            meta.variaveis.detalhes.forEach((variável:IdCodTituloDto) => {
              if (!this.variáveisPorId[variável.id]) {
                // usando cópias para evitar que uma nova chamada à API apague
                // uma referência usada em alguma outra situação. Não deve
                // acontecer, mas... Who knows?
                this.variáveisPorId[variável.id] = { ...variável };
              }
            });
          }
        });
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },
  },
});
