import { defineStore } from "pinia";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useBlocoDeNotasStore = defineStore("blocoDeNotasStore", {
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
        const { linhas } = await this.requestS.get(
          `${baseUrl}/nota/busca-por-bloco?blocos_token=${params}`
        );
        this.lista = linhas;
      } catch (erro) {
        this.erro = erro;
        console.log("erro: ", erro);
      }
      this.chamadasPendentes.lista = false;
    },
    
    async salvarItem(params = {}, id = 0) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        if (params.id) {
          await this.requestS.patch(`${baseUrl}/nota/${params.id}`, params);
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
  },

  getters: {
    itemParaEdição({ emFoco }) {
      return {
        ...emFoco,
      };
    },
  },
});
