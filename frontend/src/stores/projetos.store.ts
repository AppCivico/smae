/* eslint-disable import/no-extraneous-dependencies */
import { requestS } from '@/helpers';
import { defineStore } from 'pinia';

import { ListDadosMetaIniciativaAtividadesDto } from '@/../../backend/src/meta/dto/create-meta.dto';
import { ListProjetoDto, ProjetoDetailDto } from '@/../../backend/src/pp/projeto/entities/projeto.entity';
import { ListProjetoProxyPdmMetaDto } from '@/../../backend/src/pp/projeto/entities/projeto.proxy-pdm-meta.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoDto['linhas'];
type PdmsSimplificados = ListProjetoProxyPdmMetaDto['linhas'];
type MetaSimplificada = ListDadosMetaIniciativaAtividadesDto['linhas'];

interface ChamadasPendentes {
  lista: boolean,
  emFoco: boolean,
  pdmsSimplificados: boolean,
  metaSimplificada: boolean,
}

interface Estado {
  lista: Lista;
  emFoco: ProjetoDetailDto | null;
  chamadasPendentes: ChamadasPendentes;
  pdmsSimplificados: PdmsSimplificados;
  metaSimplificada: MetaSimplificada;
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

async function buscarItem(this: Estado, id = 0, params = {}): Promise<void> {
  this.chamadasPendentes.emFoco = true;
  try {
    const resposta = await requestS.get(`${baseUrl}/projeto/${id}`, params);
    this.emFoco = resposta;
  } catch (erro: unknown) {
    this.erro = erro;
  }
  this.chamadasPendentes.emFoco = false;
}

async function buscarPdms(this: Estado, params = {}): Promise<void> {
  this.chamadasPendentes.pdmsSimplificados = true;
  this.pdmsSimplificados = [];

  try {
    const { linhas } = await requestS.get(`${baseUrl}/projeto/proxy/pdm-e-metas`, params);
    this.pdmsSimplificados = linhas;
  } catch (erro: unknown) {
    this.erro = erro;
  }
  this.chamadasPendentes.pdmsSimplificados = false;
}

async function buscarMetaSimplificada(this: Estado, params = {}): Promise<void> {
  this.chamadasPendentes.metaSimplificada = true;
  this.metaSimplificada = [];

  try {
    const { linhas } = await requestS.get(`${baseUrl}/projeto/proxy/iniciativas-atividades`, params);
    [this.metaSimplificada] = linhas;
  } catch (erro: unknown) {
    this.erro = erro;
  }
  this.chamadasPendentes.metaSimplificada = false;
}

async function salvarItem(this: Estado, params = {}, id = 0): Promise<boolean> {
  this.chamadasPendentes.emFoco = true;

  try {
    let resposta;

    if (id) {
      resposta = await requestS.patch(`${baseUrl}/projeto/${id}`, params);
    } else {
      resposta = await requestS.post(`${baseUrl}/projeto`, params);
    }

    this.chamadasPendentes.emFoco = false;
    return resposta;
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

const pdmsPorId = ({ pdmsSimplificados }: Estado) => pdmsSimplificados
  .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {});

export const useProjetosStore = defineStore('projetos', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: true,
      emFoco: true,
      pdmsSimplificados: false,
      metaSimplificada: false,
    },

    pdmsSimplificados: [],
    metaSimplificada: [],
    erro: null,
  }),
  actions: {
    buscarItem,
    buscarPdms,
    buscarMetaSimplificada,
    buscarTudo,
    excluirItem,
    salvarItem,
  },
  getters: {
    pdmsPorId,
    projetosPorId,
  },
});
