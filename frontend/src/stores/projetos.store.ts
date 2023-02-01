import { requestS } from '@/helpers';
import { defineStore } from 'pinia';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ListProjetoDto, ProjetoDetailDto } from '@/../../backend/src/pp/projeto/entities/projeto.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoDto['linhas'];

interface ChamadasPendentes {
  lista: boolean,
  emFoco: boolean,
}

interface Estado {
  lista: Lista;
  emFoco: ProjetoDetailDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown,
}

async function buscarTudo(this: Estado, params = {}): Promise<void> {
  this.chamadasPendentes.lista = true;
  this.chamadasPendentes.emFoco = true;
  try {
    const { linhas } = await requestS.get(`${baseUrl}/projeto`, params);
    this.lista = linhas;
  } catch (erro: unknown) {
    this.erro = erro;
  }
  this.chamadasPendentes.lista = false;
  this.chamadasPendentes.emFoco = false;
}

async function salvarItem(this: Estado, params = {}, id = 0): Promise<boolean> {
  this.chamadasPendentes.emFoco = true;

  try {
    if (id) {
      await requestS.patch(`${baseUrl}/projeto/${id}`, params);
    } else {
      await requestS.post(`${baseUrl}/projeto`, params);
    }

    this.chamadasPendentes.emFoco = false;
    return true;
  } catch (erro) {
    this.erro = erro;
    this.chamadasPendentes.emFoco = false;
    return false;
  }
}

async function excluirItem(this: Estado, id: Number): Promise<boolean> {
  this.chamadasPendentes.lista = true;

  try {
    await requestS.delete(`${baseUrl}/projeto/${id}`);

    this.chamadasPendentes.lista = false;
    return true;
  } catch (erro) {
    this.erro = erro;
    this.chamadasPendentes.lista = false;
    return false;
  }
}

const projetosPorId = ({ lista }: Estado) => lista
  .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {});

export const useProjetosStore = defineStore('projetos', {
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
    buscarTudo,
    excluirItem,
    salvarItem,
  },
  getters: {
    projetosPorId,
  },
});
