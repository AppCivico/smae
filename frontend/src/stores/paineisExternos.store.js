import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const usePaineisExternosStore = defineStore('paineisExternos', {
  state: () => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: true,
      emFoco: true,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/painel-externo/${id}`, params);
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
        const { linhas } = await this.requestS.get(`${baseUrl}/painel-externo`, params);
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
        await this.requestS.delete(`${baseUrl}/painel-externo/${id}`);
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
          await this.requestS.patch(`${baseUrl}/painel-externo/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/painel-externo`, params);
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
    itemParaEdição(emFoco) {
      return {
        ...emFoco,
        // nivel_maximo_tarefa: emFoco?.nivel_maximo_tarefa || 5,
        // nivel_regionalizacao: emFoco?.nivel_regionalizacao || 1,
        // data_criacao: emFoco?.data_criacao ? dateTimeToDate(emFoco?.data_criacao) : null,
        // orcamento_execucao_disponivel_meses: emFoco?.orcamento_execucao_disponivel_meses
        //   && Array.isArray(emFoco.orcamento_execucao_disponivel_meses)
        //   ? emFoco.orcamento_execucao_disponivel_meses
        //   : range(1, 13),
      };
    },
  },
});
