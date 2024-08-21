import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useEquipesStore = defineStore('equipesStore', {
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
    async buscarItem(params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/grupo-variavel-responsavel`, params);
        this.emFoco = resposta?.linhas?.[0] || null;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/grupo-variavel-responsavel`, params);
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
        await this.requestS.delete(`${baseUrl}/grupo-variavel-responsavel/${id}`);
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
          await this.requestS.patch(`${baseUrl}/grupo-variavel-responsavel/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/grupo-variavel-responsavel`, params);
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
        participantes: emFoco?.participantes?.map((participante) => participante.id) || [],
        colaboradores: emFoco?.colaboradores?.map((colaborador) => colaborador.id) || [],
      };
    },

    gruposPorOrgaoIdPorPerfil: ({ lista }) => lista.reduce((acc, grupo) => {
      if (!acc[grupo.orgao_id]) {
        acc[grupo.orgao_id] = {};
      }

      if (!acc[grupo.orgao_id][grupo.perfil]) {
        acc[grupo.orgao_id][grupo.perfil] = [];
      }

      acc[grupo.orgao_id][grupo.perfil].push(grupo);
      return acc;
    }, {}),
  },
});
