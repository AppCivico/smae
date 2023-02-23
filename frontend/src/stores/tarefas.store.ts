/* eslint-disable import/no-extraneous-dependencies */
import { ListTarefaDto, TarefaItemDto } from '@/../../backend/src/pp/tarefa/entities/tarefa.entity';
import createDataTree from '@/helpers/createDataTree';
import filtrarObjetos from '@/helpers/filtrarObjetos';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListTarefaDto['linhas'];

interface ChamadasPendentes {
  lista: boolean,
  emFoco: boolean,
}

interface Estado {
  lista: Lista;
  emFoco: TarefaItemDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown,
  requestS?: any,
  route?: any,
}

async function buscarTudo(this: Estado, params = {}, projetoId = 0): Promise<void> {
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
}

async function buscarItem(this: Estado, id = 0, params = {}, projetoId = 0): Promise<void> {
  this.chamadasPendentes.emFoco = true;
  try {
    const resposta = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/tarefa/${id}`, params);
    this.emFoco = {
      ...resposta,

    };
  } catch (erro: unknown) {
    this.erro = erro;
  }
  this.chamadasPendentes.emFoco = false;
}

async function salvarItem(this: Estado, params = {}, id = 0, projetoId = 0): Promise<boolean> {
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
}

async function excluirItem(this: Estado, id: Number, projetoId = 0): Promise<boolean> {
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
}

const tarefasPorId = ({ lista }: Estado) => lista
  .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {});

const árvoreDeTarefas = ({ lista }: Estado) => createDataTree(lista, 'tarefa_pai_id');

// eslint-disable-next-line max-len
const listaFiltradaPor = ({ lista }: Estado) => (termo: string | number) => filtrarObjetos(lista, termo);

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
    buscarItem,
    buscarTudo,
    excluirItem,
    salvarItem,
  },
  getters: {
    árvoreDeTarefas,
    listaFiltradaPor,
    tarefasPorId,
  },
});
