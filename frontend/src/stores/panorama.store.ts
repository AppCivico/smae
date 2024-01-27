import { defineStore } from 'pinia';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ListMfDashMetasDto } from '@/../../backend/src/mf/metas/dash/dto/metas.dto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IdCodTituloDto } from '@/../../backend/src/common/dto/IdCodTitulo.dto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IdTituloOrNullDto } from '@/../../backend/src/common/dto/IdTitulo.dto';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  lista: boolean;
};

type Estado = {
  listaDePendentes: ListMfDashMetasDto['pendentes'];
  listaDeAtualizadas: ListMfDashMetasDto['atualizadas'];
  listaDeAtrasadas: ListMfDashMetasDto['atrasadas'];

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

export const usePanoramaStore = defineStore('panorama', {
  state: (): Estado => ({
    listaDePendentes: [],
    listaDeAtualizadas: [],
    listaDeAtrasadas: [],

    tarefasPorId: {},
    variáveisPorId: {},

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

        let lista:ListMfDashMetasDto['pendentes'] | ListMfDashMetasDto['atualizadas'] = [];

        switch (tipoDaLista) {
          case 'pendentes':
            if (Array.isArray(resposta.pendentes)) {
              this.listaDePendentes = resposta.pendentes;
              lista = resposta.pendentes;
            }
            break;

          case 'atualizadas':
            if (Array.isArray(resposta.atualizadas)) {
              this.listaDeAtualizadas = resposta.atualizadas;
              lista = resposta.atualizadas;
            }
            break;

          case 'atrasadas':
            if (Array.isArray(resposta.atrasadas)) {
              this.listaDeAtrasadas = resposta.atrasadas;
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
