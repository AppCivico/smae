import { defineStore } from "pinia";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useEmailsStore = defineStore("emailsStore", {
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
    async buscarItem( params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/aviso-email/`,
          params
        );
        this.emFoco = {
          ...resposta,
        };
        this.chamadasPendentes.emFoco = false;
        return resposta;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/aviso-email/${id}`);
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
        if (params.id) {
          await this.requestS.patch(`${baseUrl}/aviso-email/${params.id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/aviso-email`, params);
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
    itemParaEdicao({ emFoco }) {
      return {
        ...emFoco,
      };
    },
  },
});
