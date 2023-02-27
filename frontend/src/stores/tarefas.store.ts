/* eslint-disable import/no-extraneous-dependencies */
import { ListTarefaDto, TarefaItemDto } from '@/../../backend/src/pp/tarefa/entities/tarefa.entity';
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
  emFoco: TarefaItemDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
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
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/tarefa`, params);

        this.lista = linhas;
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
  },
  getters: {
    árvoreDeTarefas(): any {
      return createDataTree(this.tarefasComHierarquia as any, 'tarefa_pai_id') || [];
    },
    itemParaEdição: ({ emFoco }) => ({
      ...emFoco,
      inicio_planejado: dateTimeToDate(emFoco?.inicio_planejado),
      inicio_real: dateTimeToDate(emFoco?.inicio_real),
      termino_planejado: dateTimeToDate(emFoco?.termino_planejado),
      termino_real: dateTimeToDate(emFoco?.termino_real),
      orgao_id: emFoco?.orgao?.id || 0,
    }),
    // eslint-disable-next-line max-len
    listaFiltradaPor: ({ lista }) => (termo: string | number) => filtrarObjetos(lista, termo),
    tarefasPorId: ({ lista }): { [x: number | string]: TarefaComHierarquia } => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
    tarefasAgrupadasPorMãe() {
      return (this.tarefasComHierarquia as unknown as [])
        .reduce((acc: TarefasPorNível, cur: TarefaItemDto) => ({
          ...acc,
          [cur.tarefa_pai_id || 0]: [...(acc[cur.tarefa_pai_id || 0] || []), cur],
        }), {});
    },
    tarefasAgrupadasPorNível() {
      return (this.tarefasComHierarquia as unknown as [])
        .reduce((acc: TarefasPorNível, cur: TarefaItemDto) => ({
          ...acc,
          [cur.nivel]: [...(acc[cur.nivel] || []), cur],
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
