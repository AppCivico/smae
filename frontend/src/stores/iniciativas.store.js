import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useIniciativasStore = defineStore({
  id: 'Iniciativas',
  state: () => ({
    Iniciativas: {},
    singleIniciativa: {},
    relacionadosIniciativa: {},
  }),
  actions: {
    clear() {
      this.Iniciativas = {};
      this.singleIniciativa = {};
    },
    clearEdit() {
      this.singleIniciativa = {};
    },
    async getAll(meta_id) {
      try {
        if (!meta_id) {
          throw 'Meta inválida';
        }
        if (!this.Iniciativas[meta_id]?.length) {
          this.Iniciativas[meta_id] = { loading: true };
        }
        const r = await this.requestS.get(`${baseUrl}/iniciativa?meta_id=${meta_id}`);

        this.Iniciativas[meta_id] = r.linhas.map((x) => {
          x.compoe_indicador_meta = x.compoe_indicador_meta ? '1' : false;
          return x;
        });
        return true;
      } catch (error) {
        this.Iniciativas[meta_id] = { error };
        return false;
      }
    },
    async getRelacionados(params) {
      try {
        if (params.iniciativa_id) {
          const response = await this.requestS.get(`${baseUrl}/meta/relacionados/`, params);
          this.relacionadosIniciativa = response;
          return true;
        }
        throw new Error('ID do PdM ou iniciativa não fornecido.');
      } catch (error) {
        this.relacionadosIniciativa = { error };
        return false;
      }
    },
    async getById(meta_id, iniciativa_id) {
      try {
        if (!meta_id) {
          throw 'Meta inválida';
        }
        if (!iniciativa_id) {
          throw 'Iniciativa inválida';
        }
        this.singleIniciativa = { loading: true };
        if (!this.Iniciativas[meta_id]?.length) {
          await this.getAll(meta_id);
        }
        this.singleIniciativa = this.Iniciativas[meta_id].length
          ? this.Iniciativas[meta_id].find((u) => u.id == iniciativa_id)
          : {};
        return true;
      } catch (error) {
        this.singleIniciativa = { error };
      }
    },
    async insert(params) {
      const r = await this.requestS.post(`${baseUrl}/iniciativa`, params);
      if (r.id) {
        return r.id;
      }
      return false;
    },
    async update(id, params) {
      if (await this.requestS.patch(`${baseUrl}/iniciativa/${id}`, params)) {
        return true;
      }
      return false;
    },
    async delete(meta_id, iniciativa_id) {
      if (await this.requestS.delete(`${baseUrl}/iniciativa/${iniciativa_id}`)) {
        this.Iniciativas[meta_id] = {};
        this.getAll(meta_id);
        return true;
      }
      return false;
    },
  },
  getters: {
    órgãosResponsáveisNaIniciativaEmFoco: ({ singleIniciativa }) => (
      Array.isArray(singleIniciativa?.orgaos_participantes)
        ? singleIniciativa.orgaos_participantes.filter((x) => x.responsavel)
        : []
    ),
  },
});
