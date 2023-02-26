/* eslint-disable import/no-extraneous-dependencies */
import { ProjetoPermissoesDto } from '@../../backend/src/pp/projeto/entities/projeto.entity';
import { ListDadosMetaIniciativaAtividadesDto } from '@/../../backend/src/meta/dto/create-meta.dto';
import { ProjetoAcao } from '@/../../backend/src/pp/projeto/acao/dto/acao.dto';
import { ListProjetoDto, ProjetoDetailDto } from '@/../../backend/src/pp/projeto/entities/projeto.entity';
import { ListProjetoProxyPdmMetaDto } from '@/../../backend/src/pp/projeto/entities/projeto.proxy-pdm-meta.entity';
import { requestS } from '@/helpers';
import filtrarObjetos from '@/helpers/filtrarObjetos';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoDto['linhas'];
type PdmsSimplificados = ListProjetoProxyPdmMetaDto['linhas'];
type MetaSimplificada = ListDadosMetaIniciativaAtividadesDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  pdmsSimplificados: boolean;
  metaSimplificada: boolean;
  mudarStatus: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: ProjetoDetailDto | null;
  chamadasPendentes: ChamadasPendentes;

  permissões: ProjetoPermissoesDto | null;
  pdmsSimplificados: PdmsSimplificados;
  metaSimplificada: MetaSimplificada;
  erro: null | unknown;
}

export const useProjetosStore = defineStore('projetos', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: true,
      emFoco: true,
      pdmsSimplificados: false,
      metaSimplificada: false,
      mudarStatus: false,
    },

    permissões: null,

    pdmsSimplificados: [],
    metaSimplificada: [],
    erro: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await requestS.get(`${baseUrl}/projeto/${id}`, params);
        this.emFoco = {
          ...resposta,
          permissoes: undefined,
        };
        this.permissões = resposta.permissoes;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },
    async buscarPdms(params = {}): Promise<void> {
      this.chamadasPendentes.pdmsSimplificados = true;
      this.pdmsSimplificados = [];

      try {
        const { linhas } = await requestS.get(`${baseUrl}/projeto/proxy/pdm-e-metas`, params);
        this.pdmsSimplificados = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.pdmsSimplificados = false;
    },
    async buscarMetaSimplificada(params = {}): Promise<void> {
      this.chamadasPendentes.metaSimplificada = true;
      this.metaSimplificada = [];

      try {
        const { linhas } = await requestS.get(`${baseUrl}/projeto/proxy/iniciativas-atividades`, params);
        [this.metaSimplificada] = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.metaSimplificada = false;
    },
    async buscarTudo(params = {}): Promise<void> {
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
    },
    async excluirItem(id: Number): Promise<boolean> {
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
    },
    async mudarStatus(id: Number, ação: ProjetoAcao): Promise<boolean> {
      this.chamadasPendentes.mudarStatus = true;

      try {
        await requestS.patch(`${baseUrl}/projeto-acao`, { acao: ação, projeto_id: id });

        this.chamadasPendentes.mudarStatus = false;

        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.mudarStatus = false;
        return false;
      }
    },
    async salvarItem(params = {}, id = 0): Promise<boolean> {
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
    },
  },
  getters: {
    // eslint-disable-next-line max-len
    listaFiltradaPor: ({ lista }: Estado) => (termo: string | number) => filtrarObjetos(lista, termo),
    pdmsPorId: ({ pdmsSimplificados }: Estado) => pdmsSimplificados
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
    projetosPorId: ({ lista }: Estado) => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
