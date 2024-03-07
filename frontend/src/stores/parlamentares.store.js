import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useParlamentaresStore = defineStore('parlamentaresStore', {
  state: () => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
      equipe: false,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/parlamentar/${id}`, params);
        this.emFoco = {
          ...resposta,
        };
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/parlamentar`, params);
        this.lista = linhas;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/parlamentar/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/parlamentar/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/parlamentar`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async salvarPessoaNaEquipe(params = {}, { pessoaId = 0, parlamentarId } = this.route.params) {
      this.chamadasPendentes.equipe = true;
      this.erro = null;

      if (!parlamentarId) {
        throw new Error('id da parlamentar ausente');
      }

      try {
        if (pessoaId) {
          await this.requestS.patch(`${baseUrl}/parlamentar/${parlamentarId}/equipe/${pessoaId}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/parlamentar/${parlamentarId}/equipe`, params);
        }

        this.chamadasPendentes.equipe = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.equipe = false;
        return false;
      }
    },
  },

  getters: {
    itemParaEdição({ emFoco }) {
      return {
        ...emFoco,
      };
    },
    pessoaParaEdição({ emFoco }) {
      const { pessoaId } = this.route.params;

      const pessoa = pessoaId && Array.isArray(emFoco?.equipe)
        ? emFoco.equipe.find((x) => Number(pessoaId) === x.id)
        : {};

      return {
        ...pessoa,
      };
    },
  },
});
