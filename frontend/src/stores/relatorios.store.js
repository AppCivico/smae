import { requestS } from '@/helpers';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export default defineStore('relatorios', {
  state: () => ({
    relatorios: [],
    current: {
    },
    loading: true,
    error: false,
  }),
  actions: {
    clear() {
      this.relatorios = {};
    },
    async getAll(params = {}) {
      this.loading = true;
      try {
        const r = await requestS.get(`${baseUrl}/relatorios`, params);
        this.relatorios = r.linhas;
      } catch (error) {
        this.error = error;
      }
    },
    async getById(id) {
    },
    async insert(params) {
      if (await requestS.post(`${baseUrl}/relatorios`, params)) return true;
      return false;
    },

    async update(id, params) {
    },
    async delete(id) {
      if (await requestS.delete(`${baseUrl}/relatorios/${id}`)) {
        this.relatorios = this.relatorios.filter((x) => x.id != id);
        return true;
      }
      return false;
    },
  },
});
