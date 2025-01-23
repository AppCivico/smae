import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return 'tag';
    case 'planoSetorial':
    case 'programaDeMetas':
      return 'plano-setorial-tag';
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

export const useTagsPsStore = defineStore('tagsPsStore', {
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
    async buscarItem(id = 0, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`, params);
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
        const { linhas } = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}`, params);
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
        await this.requestS.delete(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`);
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
          await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta)}`, params);
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
        upload_icone: emFoco?.icone,
      };
    },
    tagsPorPlano: ({ Tags }) => (Array.isArray(Tags)
      ? Tags.reduce((acc, tag) => {
        if (!acc[tag.pdm_id]) {
          acc[tag.pdm_id] = [];
        }
        acc[tag.pdm_id].push(tag);
        return acc;
      })
      : {}),
  },
});
