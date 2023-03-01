/* eslint-disable import/no-extraneous-dependencies */
import { ListTarefaDto, TarefaDetailDto, TarefaItemDto } from '@/../../backend/src/pp/tarefa/entities/tarefa.entity';
import createDataTree from '@/helpers/createDataTree';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import filtrarObjetos from '@/helpers/filtrarObjetos';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListTarefaDto['linhas'];

interface TarefaComHierarquia extends TarefaItemDto {
  hierarquia: string;
}

interface TarefasPorNível {
  [key: string]: TarefaItemDto[];
}

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: TarefaDetailDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
  extra: any;
}

// eslint-disable-next-line max-len
function resolverHierarquia(tarefa: TarefaItemDto, tarefasPorId: { [x: string | number]: TarefaItemDto }): string {
  return tarefa.tarefa_pai_id
    ? `${resolverHierarquia(tarefasPorId[tarefa.tarefa_pai_id], tarefasPorId)}.${tarefa.numero}`
    : String(tarefa.numero);
}

export const useTarefasStore = defineStore('tarefas', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: true,
      emFoco: true,
    },

    erro: null,
    extra: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}, projetoId = 0): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/tarefa/${id}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}, projetoId = 0): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;

      try {
        const { linhas, portfolio, projeto } = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/tarefa`, params);

        this.lista = linhas;
        this.extra = { portfolio, projeto };
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id: Number, projetoId = 0): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/tarefa/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0, projetoId = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/tarefa/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/tarefa`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async validarDependências(params: { tarefa_corrente_id: number; dependencias: [] }) {
      try {
        const resposta = await this.requestS.post(`${baseUrl}/projeto/${this.route.params.projetoId}/dependencias`, params);

        this.$patch({
          emFoco: { ...this.emFoco, ...r },
        });

        return resposta;
      } catch (erro) {
        this.erro = erro;
        return false;
      }
    },

  },
  getters: {
    árvoreDeTarefas(): any {
      return createDataTree(this.tarefasComHierarquia as any, 'tarefa_pai_id') || [];
    },

    itemParaEdição: ({ emFoco, route }) => ({
      ...emFoco,
      descricao: emFoco?.descricao || '',
      inicio_planejado: dateTimeToDate(emFoco?.inicio_planejado),
      inicio_real: dateTimeToDate(emFoco?.inicio_real),
      recursos: emFoco?.recursos || '',
      termino_planejado: dateTimeToDate(emFoco?.termino_planejado),
      termino_real: dateTimeToDate(emFoco?.termino_real),

      nivel: emFoco?.nivel || Number(route.query.nivel) || 1,
      tarefa_pai_id: emFoco?.tarefa_pai_id || Number(route.query.tarefa_pai_id) || null,
      numero: emFoco?.numero || Number(route.query.numero) || 0,

      orgao_id: emFoco?.orgao?.id || 0,
    }),
    // eslint-disable-next-line max-len
    listaFiltradaPor: ({ lista }) => (termo: string | number) => filtrarObjetos(lista, termo),

    tarefasPorId: ({ lista }): { [x: number | string]: TarefaComHierarquia } => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    tarefasAgrupadasPorMãe(): { [x: number | string]: TarefaComHierarquia[] } {
      return (this.tarefasComHierarquia as unknown as [])
        .reduce((acc: TarefasPorNível, cur: TarefaItemDto) => ({
          ...acc,
          [cur.tarefa_pai_id || 0]: [...(acc[cur.tarefa_pai_id || 0] || []), cur],
        }), {});
    },

    tarefasComHierarquia(): TarefaComHierarquia[] {
      return this.lista
        .map((x: TarefaItemDto) => ({ ...x, hierarquia: resolverHierarquia(x, this.tarefasPorId) }))
        .sort((a: TarefaComHierarquia, b: TarefaComHierarquia) => {
          if (a.hierarquia < b.hierarquia) {
            return -1;
          }
          if (a.hierarquia > b.hierarquia) {
            return 1;
          }
          return 0;
        });
    },
  },
});
