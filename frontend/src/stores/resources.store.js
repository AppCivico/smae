import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useResourcesStore = defineStore('resources', {
  state: () => ({
    resources: {},
    tempResources: {},
  }),
  actions: {
    clear() {
      this.resources = {};
      this.tempResources = {};
    },
    async getAll() {
      this.resources = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/unidade-medida`);
        this.resources = r.linhas;
      } catch (error) {
        this.resources = { error };
      }
    },
    async getById(id) {
      this.tempResources = { loading: true };
      try {
        if (!this.resources.length) {
          await this.getAll();
        }
        this.tempResources = this.resources.find((u) => u.id == id);
        if (!this.tempResources) throw 'Fonte de recurso não encontrada';
      } catch (error) {
        this.tempResources = { error };
      }
    },
    async insertType(params) {
      if (await this.requestS.post(`${baseUrl}/unidade-medida`, params)) return true;
      return false;
    },
    async updateType(id, params) {
      const m = {
        sigla: params.sigla,
        fonte: params.fonte,
      };
      if (await this.requestS.patch(`${baseUrl}/unidade-medida/${id}`, m)) return true;
      return false;
    },
    async deleteType(id) {
      if (await this.requestS.delete(`${baseUrl}/unidade-medida/${id}`)) return true;
      return false;
    },
    async filterResources(f) {
      this.tempResources = { loading: true };
      try {
        if (!this.resources.length) {
          await this.getAll();
        }
        this.tempResources = f ? this.resources.filter((u) => (f.textualSearch ? (u.fonte + u.sigla).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1)) : this.resources;
      } catch (error) {
        this.tempResources = { error };
      }
    },
  },
});
