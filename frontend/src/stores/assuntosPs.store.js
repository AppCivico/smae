import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAssuntosStore = defineStore('assuntosStore', {
  state: () => ({
    lista: [],
    categorias: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/assunto-variavel/${id}`, params);
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
        const { linhas } = await this.requestS.get(`${baseUrl}/assunto-variavel`, params);
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
        await this.requestS.delete(`${baseUrl}/assunto-variavel/${id}`);
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
          await this.requestS.patch(`${baseUrl}/assunto-variavel/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/assunto-variavel`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async buscarCategorias() {
      this.chamadasPendentes.categorias = false;
      this.erro = null;

      try {
        this.chamadasPendentes.categorias = true;

        const data = await this.requestS.get(
          `${baseUrl}/categoria-assunto-variavel`,
        );

        this.categorias = data.linhas;
      } catch (erro) {
        this.erro = erro;
      } finally {
        this.chamadasPendentes.categorias = false;
      }
    },
  },

  getters: {
    itemParaEdicao({ emFoco }) {
      return {
        ...emFoco,
      };
    },
  },
});
