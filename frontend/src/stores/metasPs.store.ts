/* eslint-disable import/no-extraneous-dependencies */
import { Meta } from '@/../../backend/src/meta/entities/meta.entity';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ListMetaDto } from '@/../../backend/src/meta/dto/list-meta.dto';

import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListMetaDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Erros {
  lista: unknown;
  emFoco: unknown;
}

interface Estado {
  lista: Lista;
  emFoco: Meta | null;

  chamadasPendentes: ChamadasPendentes;
  erros: Erros;

  paginacao: {
    tokenPaginacao: string;
    paginas: number;
    paginaCorrente: number;
    temMais: boolean;
    totalRegistros: number;
  };
}

export const usePsMetasStore = defineStore('psMetas', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erros: {
      lista: null,
      emFoco: null,
    },
    paginacao: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: true,
      totalRegistros: 0,
    },
  }),
  actions: {
    async buscarItem(metaId: number, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/meta-setorial/${metaId || this.route.params.metaId}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;

      try {
        const {
          linhas,
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.get(`${baseUrl}/meta-setorial`, params);

        this.lista = linhas;

        this.paginacao.tokenPaginacao = tokenPaginacao;
        this.paginacao.paginas = paginas;
        this.paginacao.paginaCorrente = paginaCorrente;
        this.paginacao.temMais = temMais;
        this.paginacao.totalRegistros = totalRegistros;
      } catch (erro: unknown) {
        this.erros.lista = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(metaId: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/meta-setorial/${metaId || this.route.params.metaId}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, metaId = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (metaId) {
          resposta = await this.requestS.patch(`${baseUrl}/meta-setorial/${metaId || this.route.params.metaId}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/meta-setorial`, params);
        }

        this.chamadasPendentes.emFoco = false;
        this.erros.emFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
  getters: {
    itemParaEdição: ({ emFoco }) => ({
      ...emFoco,
    }),

    metasPorId: ({ lista }: Estado) => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
