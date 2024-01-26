import { defineStore } from 'pinia';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ListMfDashMetasDto } from '@/../../backend/src/mf/metas/dash/dto/metas.dto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IdCodTituloDto } from '@/../../backend/src/common/dto/IdCodTitulo.dto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IdTituloOrNullDto } from '@/../../backend/src/common/dto/IdTitulo.dto';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type DetalhesPorId = {
  tarefas: {
    [key: string]: IdTituloOrNullDto;
  };
  variáveis:
  {
    [key: string]: IdCodTituloDto;
  };
};

type ChamadasPendentes = {
  lista: boolean;
};

type Estado = {
  listaDePendentes: ListMfDashMetasDto['pendentes'];
  listaDeAtualizadas: ListMfDashMetasDto['atualizadas'];
  listaDeAtrasadas: ListMfDashMetasDto['atrasadas'];

  perfil: ListMfDashMetasDto['perfil'] | '';

  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
};

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
  getters: {
    detalhesPorId: (({ listaDePendentes, listaDeAtualizadas }) => {
      const mapaDeDetalhes:DetalhesPorId = {
        tarefas: {},
        variáveis: {},
      };

      [listaDePendentes, listaDeAtualizadas]
        .forEach((lista) => {
          lista?.forEach((meta) => {
            if (Array.isArray(meta.cronograma?.detalhes)) {
              meta.cronograma.detalhes.forEach((tarefa:IdTituloOrNullDto) => {
                if (!mapaDeDetalhes.tarefas[tarefa.id]) {
                  // usando cópias para evitar que uma nova chamada à API apague
                  // uma referência usada em alguma outra situação. Não deve
                  // acontecer, mas... Who knows?
                  mapaDeDetalhes.tarefas[tarefa.id] = { ...tarefa };
                }
              });
            }
            if (Array.isArray(meta.variaveis?.detalhes)) {
              meta.variaveis.detalhes.forEach((variável:IdCodTituloDto) => {
                if (!mapaDeDetalhes.variáveis[meta.id]) {
                  // usando cópias para evitar que uma nova chamada à API apague
                  // uma referência usada em alguma outra situação. Não deve
                  // acontecer, mas... Who knows?
                  mapaDeDetalhes.variáveis[meta.id] = { ...variável };
                }
              });
            }
          });
        });
      return mapaDeDetalhes;
    }),
  },
});
