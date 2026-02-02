import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAreasTematicasStore = defineStore('areasTematicas', {
  state: () => ({
    lista: [],
    emFoco: null,
    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
  }),

  actions: {
    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/area-tematica`, params);
        this.lista = linhas || [];
      } catch (erro) {
        this.erro = erro;
      }

      this.chamadasPendentes.lista = false;
    },

    async buscarItem(id, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/area-tematica/${id}`, params);
        this.emFoco = resposta;
      } catch (erro) {
        this.erro = erro;
      }

      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/area-tematica/${id}`);
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
          await this.requestS.patch(`${baseUrl}/area-tematica/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/area-tematica`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },

  getters: {
    itemParaEdicao: ({ emFoco }) => (emFoco ? { ...emFoco } : null),
  },
});
