/* eslint-disable import/no-extraneous-dependencies */
import { ProjetoDetailDto } from '@/../../backend/src/pp/projeto/entities/projeto.entity';
import { ListTarefaDto, TarefaDetailDto, TarefaItemDto } from '@/../../backend/src/pp/tarefa/entities/tarefa.entity';

import createDataTree from '@/helpers/createDataTree';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import flatten from '@/helpers/flatDataTree';
import { defineStore } from 'pinia';
import { useProjetosStore } from './projetos.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListTarefaDto['linhas'];

interface TarefaComHierarquia extends TarefaItemDto {
  hierarquia: string;
}

interface TarefaComMãe extends TarefaComHierarquia {
  parentId: number;
}

interface ProjetoParaÁrvore extends ProjetoDetailDto {
  parentId?: 0;
  idDoProjeto: number;
  id: 0;
}

interface TarefasPorNível {
  [key: string]: TarefaItemDto[];
}

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  validaçãoDeDependências: boolean;
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
      validaçãoDeDependências: false,
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

    async excluirItem(id: number, projetoId = 0): Promise<boolean> {
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
        this.erro = null;
        return resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async validarDependências(params: { tarefa_corrente_id: number; dependencias: [] }) {
      this.chamadasPendentes.validaçãoDeDependências = true;

      try {
        type Atualização = {
          inicio_planejado_calculado: boolean;
          duracao_planejado_calculado: boolean;
          termino_planejado_calculado: boolean;
          inicio_planejado?: string | null;
          duracao_planejado?: number | null | undefined;
          termino_planejado?: string | null;
        };

        const resposta: Atualização = await this.requestS.post(`${baseUrl}/projeto/${this.route.params.projetoId}/dependencias`, params);

        this.chamadasPendentes.validaçãoDeDependências = false;
        this.erro = null;

        return resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.validaçãoDeDependências = false;
        return false;
      }
    },

  },
  getters: {
    árvoreDeTarefas(): TarefaComHierarquia[] {
      return createDataTree(this.tarefasComHierarquia as any, 'tarefa_pai_id') || [];
    },

    estruturaAnalíticaDoProjeto(): (TarefaComMãe | ProjetoParaÁrvore)[] {
      const projetos = useProjetosStore();

      if (projetos?.emFoco) {
        const projeto: ProjetoParaÁrvore = {
          ...projetos?.emFoco,
          idDoProjeto: projetos?.emFoco?.id,
          id: 0,
        };

        return [
          ...this.tarefasComHierarquia.map((x) => ({ ...x, parentId: x.tarefa_pai_id || projeto.id })),
          projeto,
        ];
      }
      return [];
    },

    itemParaEdição(): {} {
      const { emFoco, route, tarefasAgrupadasPorMãe } = this;
      const idDaTarefaMãe = emFoco?.tarefa_pai_id || Number(route.query.tarefa_pai_id) || null;
      const posiçõesEmUso = tarefasAgrupadasPorMãe[idDaTarefaMãe || 0]?.length || 0;

      return {
        ...emFoco,
        descricao: emFoco?.descricao || '',
        inicio_planejado: dateTimeToDate(emFoco?.inicio_planejado),
        inicio_real: dateTimeToDate(emFoco?.inicio_real),
        recursos: emFoco?.recursos || '',
        termino_planejado: dateTimeToDate(emFoco?.termino_planejado),
        termino_real: dateTimeToDate(emFoco?.termino_real),

        nivel: emFoco?.nivel || Number(route.query.nivel) || 1,
        tarefa_pai_id: idDaTarefaMãe,
        numero: emFoco?.numero || (posiçõesEmUso + 1),

        orgao_id: emFoco?.orgao?.id || 0,
      };
    },

    tarefasPorId: ({ lista }): { [k: number | string]: TarefaComHierarquia } => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    tarefasAgrupadasPorMãe(): { [k: number | string]: TarefaComHierarquia[] } {
      return (this.tarefasComHierarquia as unknown as [])
        .reduce((acc: TarefasPorNível, cur: TarefaItemDto) => ({
          ...acc,
          [cur.tarefa_pai_id || 0]: [...(acc[cur.tarefa_pai_id || 0] || []), cur],
        }), {});
    },

    tarefasOrdenadas(): TarefaComHierarquia[] {
      return flatten(this.árvoreDeTarefas);
    },

    tarefasComHierarquia(): TarefaComHierarquia[] {
      return this.lista
        // eslint-disable-next-line max-len
        .map((x: TarefaItemDto) => ({ ...x, hierarquia: resolverHierarquia(x, this.tarefasPorId) }));
    },
  },
});
