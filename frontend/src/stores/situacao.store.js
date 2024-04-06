import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useSituacaoStore = defineStore('situacao', {
  state: () => ({
    lista: [],
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
        const { linhas } = await this.requestS.get(`${baseUrl}/workflow-situacao`, params);
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
        await this.requestS.delete(`${baseUrl}/workflow-situacao/${id}`);
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
          await this.requestS.patch(`${baseUrl}/workflow-situacao/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/workflow-situacao`, params);
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
    tiposPorId() {
      return this.lista.reduce((acc, current) => {
        acc[current.id] = current;
        return acc;
      }, {});
    },
  },
});
