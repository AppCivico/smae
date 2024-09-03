import dateTimeToDate from '@/helpers/dateTimeToDate';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useBlocoDeNotasStore = defineStore('blocoDeNotasStore', {
  state: () => ({
    lista: [],
    emFoco: null,
    listaPanorama: [],
    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
    paginação: {
      temMais: false,
      tokenDaPróximaPágina: '',
    },
  }),
  actions: {
    async buscarTudo(blocosToken, params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        const {
          linhas,
        } = await this.requestS.get(
          `${baseUrl}/nota/busca-por-bloco`,
          {
            ...params,
            blocos_token: blocosToken,
          },
        );
        this.lista = linhas;
      } catch (erro) {
        this.erro = erro;
        console.log('erro: ', erro);
      }
      this.chamadasPendentes.lista = false;
    },

    async salvarItem(params = {}, id = '') {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/nota/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/nota`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/nota/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async buscarItem(id = 0) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/nota/${id}`);
        this.emFoco = {
          ...resposta,
        };
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudoPanorama(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        const {
          linhas,
          tem_mais: temMais,
          token_proxima_pagina: tokenDaPróximaPágina,
        } = await this.requestS.get(
          `${baseUrl}/panorama/notas`,
          {
            ...params,
          },
        );
        if (Array.isArray(linhas)) {
          this.lista = params.token_proxima_pagina
            ? this.lista.concat(linhas)
            : linhas;

          this.paginação.temMais = temMais || false;
          this.paginação.tokenDaPróximaPágina = tokenDaPróximaPágina || '';
        }
      } catch (erro) {
        this.erro = erro;
        console.log('erro: ', erro);
      }
      this.chamadasPendentes.lista = false;
    },
  },
  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      dispara_email: emFoco?.dispara_email || false,
      data_nota: dateTimeToDate(emFoco?.data_nota) || null,
      enderecamentos: !Array.isArray(emFoco?.enderecamentos)
        ? null
        : emFoco?.enderecamentos.map(
          (x) => ({
            orgao_enderecado_id: x.orgao_enderecado?.id || 0,
            pessoa_enderecado_id: x.pessoa_enderecado?.id || 0,
          } || null),
        ),
      nota: emFoco?.nota || null,
      rever_em: dateTimeToDate(emFoco?.rever_em) || null,
      status: emFoco?.status || null,
    }),
  },
});
