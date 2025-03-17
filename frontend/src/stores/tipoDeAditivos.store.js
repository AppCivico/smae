import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useTipoDeAditivosStore = defineStore('tipoDeAditivosStore', {
  state: () => ({
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
  }),
  actions: {
    async buscarItem(id = 0, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/tipo-aditivo/${id}`, params);
        this.emFoco = {
          ...resposta,
        };
      } catch (erro) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/tipo-aditivo`, params);
        this.lista = linhas;
      } catch (erro) {
        this.erros.lista = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erros.emFoco = null;

      try {
        await this.requestS.delete(`${baseUrl}/tipo-aditivo/${id}`);
        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0) {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/tipo-aditivo/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/tipo-aditivo`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
  getters: {
    itemParaEdicao({ emFoco }) {
      return {
        ...emFoco,
        habilita_valor: emFoco?.habilita_valor || false,
        habilita_valor_data_termino: emFoco?.habilita_valor_data_termino || false,
      };
    },
    tipoDeAditivoPorId: ({ lista }) => lista.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {}),
  },
});
