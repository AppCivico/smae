import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useEquipamentosStore = defineStore('equipamentosStore', {
  state: () => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: {
      lista: null,
      emFoco: null,
    },
  }),
  actions: {
    async buscarItem(id = 0, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro.emFoco = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/equipamento/${id}`, params);
        this.emFoco = {
          ...resposta,
        };
      } catch (erro) {
        this.erro.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro.lista = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/equipamento`, params);
        this.lista = linhas;
      } catch (erro) {
        this.erro.lista = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro.emFoco = null;

      try {
        await this.requestS.delete(`${baseUrl}/equipamento/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro.emFoco = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0) {
      this.chamadasPendentes.emFoco = true;
      this.erro.emFoco = null;

      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/equipamento/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/equipamento`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
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
  },
});
