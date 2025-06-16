import { defineStore } from 'pinia';
import type {
  ListApenasTarefaListDto,
  TarefaDetailDto,
  TarefaItemDto,
} from '@back/pp/tarefa/entities/tarefa.entity';
import type { ProjetoDetailDto } from '@back/pp/projeto/entities/projeto.entity';
import type { DataSet, DataTreeItem } from '@/helpers/createDataTree';
import createDataTree from '@/helpers/createDataTree';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import flatten from '@/helpers/flatDataTree';
import { useProjetosStore } from './projetos.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListApenasTarefaListDto['linhas'];

interface TarefaComHierarquia extends TarefaItemDto {
  hierarquia: string;
}

type TarefaEmArvore = DataTreeItem & TarefaComHierarquia;

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
  clonarTarefas: boolean;
  validaçãoDeDependências: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: TarefaDetailDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
  extra: any;
}

type MãeComId = {
  projetoId?: number;
  transferenciaId?: number;
  obraId?: number;
} | undefined;

// eslint-disable-next-line max-len
function resolverHierarquia(tarefa: TarefaItemDto, tarefasPorId: { [x: string | number]: TarefaItemDto }): string {
  return tarefa.tarefa_pai_id
    ? `${resolverHierarquia(tarefasPorId[tarefa.tarefa_pai_id], tarefasPorId)}.${tarefa.numero}`
    : String(tarefa.numero);
}

function gerarCaminhoParaApi(mãeComId: MãeComId): string | null {
  switch (true) {
    case !!mãeComId?.projetoId:
      return `projeto/${mãeComId?.projetoId}`;

    case !!mãeComId?.obraId:
      return `projeto-mdo/${mãeComId?.obraId}`;

    case !!mãeComId?.transferenciaId:
      return `transferencia-tarefa/${mãeComId?.transferenciaId}`;

    default:
      console.error('Id identificador da entidade mãe não foi provido como esperado:', mãeComId);
      throw new Error('Id identificador da entidade mãe não foi provido como esperado.');
  }
}

export const useTarefasStore = defineStore('tarefas', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: true,
      emFoco: true,
      clonarTarefas: false,
      validaçãoDeDependências: false,
    },

    erro: null,
    extra: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}, mãeComId: MãeComId = undefined): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/tarefa/${id}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}, mãeComId: MãeComId = undefined): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;

      try {
        const {
          linhas, portfolio, projeto, cabecalho,
        } = await this.requestS.get(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/tarefa`, params);

        this.lista = linhas;
        this.extra = { portfolio, projeto, cabecalho };
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id: number, mãeComId: MãeComId = undefined): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/tarefa/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(
      params = {},
      id = 0,
      mãeComId: MãeComId = undefined,
    ): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/tarefa/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/tarefa`, params);
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

    async clonarTarefas(
      projetoFonteId:number,
      mãeComId: MãeComId = undefined,
    ): Promise<boolean> {
      this.chamadasPendentes.clonarTarefas = true;
      this.erro = null;

      try {
        await this.requestS.post(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/clone-tarefas`, { projeto_fonte_id: projetoFonteId });

        this.chamadasPendentes.clonarTarefas = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.clonarTarefas = false;
        return false;
      }
    },

    async validarDependências(
      params: { tarefa_corrente_id: number; dependencias: [] },
      mãeComId: undefined,
    ) {
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

        const resposta: Atualização = await this.requestS.post(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/dependencias`, params);

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
    árvoreDeTarefas(): TarefaEmArvore[] {
      return createDataTree(this.tarefasComHierarquia as unknown as DataSet, { parentPropertyName: 'tarefa_pai_id' }) as TarefaEmArvore[] || [];
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
          ...this.tarefasComHierarquia.map((x) => ({
            ...x,
            parentId: x.tarefa_pai_id || projeto.id,
          })),
          projeto,
        ];
      }
      return [];
    },

    itemParaEdicao(): Record<string, unknown> {
      const { emFoco, route, tarefasAgrupadasPorMãe } = this;
      const idDaTarefaMãe = emFoco?.tarefa_pai_id || Number(route.query.tarefa_pai_id) || null;
      const posiçõesEmUso = tarefasAgrupadasPorMãe[idDaTarefaMãe || 0]?.length || 0;

      return {
        dependencias: [],
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
