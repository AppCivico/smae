import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return 'atividade';
    case 'planoSetorial':
    case 'programaDeMetas':
      return 'plano-setorial-atividade';
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

export const useAtividadesStore = defineStore({
  id: 'Atividades',
  state: () => ({
    Atividades: {},
    singleAtividade: {},
    relacionadosAtividade: {},
  }),
  actions: {
    clear() {
      this.Atividades = {};
      this.singleAtividade = {};
    },
    clearEdit() {
      this.singleAtividade = {};
    },
    async getAll(iniciativa_id) {
      try {
        if (!iniciativa_id) throw 'Iniciativa inválida';
        if (!this.Atividades[iniciativa_id]?.length) {
          this.Atividades[iniciativa_id] = { loading: true };
        }
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}?iniciativa_id=${iniciativa_id}`);

        this.Atividades[iniciativa_id] = r.linhas.map((x) => {
          x.compoe_indicador_iniciativa = x.compoe_indicador_iniciativa ? '1' : false;
          return x;
        });
        return true;
      } catch (error) {
        this.Atividades[iniciativa_id] = { error };
        return false;
      }
    },
    async getRelacionados(params) {
      try {
        if (params.atividade_id) {
          const response = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}/relacionados/`, params);
          this.relacionadosAtividade = response;
          return true;
        }
        throw new Error('ID do PdM ou atividade não fornecido.');
      } catch (error) {
        this.relacionadosAtividade = { error };
        return false;
      }
    },
    async getById(iniciativa_id, atividade_id) {
      try {
        if (!iniciativa_id) throw 'Iniciativa inválida';
        if (!atividade_id) throw 'Atividade inválida';
        this.singleAtividade = { loading: true };
        if (!this.Atividades[iniciativa_id]?.length) {
          await this.getAll(iniciativa_id);
        }
        this.singleAtividade = this.Atividades[iniciativa_id].length
          ? this.Atividades[iniciativa_id].find((u) => u.id == atividade_id)
          : {};
        return true;
      } catch (error) {
        this.singleAtividade = { error };
        return false;
      }
    },
    async getByIdReal(atividade_id) {
      // mantendo o estilo já usado nesse store
      try {
        if (!atividade_id) {
          throw 'Atividade inválida';
        }
        this.singleAtividade = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${atividade_id}`);

        this.singleAtividade = r.id ? r : false;

        if (!this.singleAtividade) throw 'Atividade não encontrada';
        return true;
      } catch (error) {
        this.singleAtividade = { error };
        return false;
      }
    },
    async insert(params) {
      const r = await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta)}`, params);
      if (r.id) return r.id;
      return false;
    },
    async update(id, params) {
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`, params)) return true;
      return false;
    },
    async delete(iniciativa_id, atividade_id) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${atividade_id}`)) {
        this.Atividades[iniciativa_id] = {};
        this.getAll(iniciativa_id);
        return true;
      }
      return false;
    },
  },
  getters: {
    órgãosResponsáveisNaAtividadeEmFoco: ({ singleAtividade }) => (
      Array.isArray(singleAtividade?.orgaos_participantes)
        ? singleAtividade.orgaos_participantes.filter((x) => x.responsavel)
        : []
    ),
  },
});
