import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useODSStore = defineStore({
  id: 'ODS',
  state: () => ({
    ODS: {},
    tempODS: {},
  }),
  actions: {
    clear() {
      this.ODS = {};
      this.tempODS = {};
    },
    async getAll() {
      this.ODS = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/ods`);
        this.ODS = r.linhas;
      } catch (error) {
        this.ODS = { error };
      }
    },
    async getById(id) {
      this.tempODS = { loading: true };
      try {
        if (!this.ODS.length) {
          await this.getAll();
        }
        // Mantendo comportamento legado
        // eslint-disable-next-line eqeqeq
        this.tempODS = this.ODS.find((u) => u.id == id);
        // Mantendo comportamento legado
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        if (!this.tempODS) throw 'ODS não encontrada';
      } catch (error) {
        this.tempODS = { error };
      }
    },
    async insert(params) {
      if (await this.requestS.post(`${baseUrl}/ods`, params)) return true;
      return false;
    },
    async update(id, params) {
      const m = {
        numero: params.numero,
        titulo: params.titulo,
        descricao: params.descricao,
      };
      if (await this.requestS.patch(`${baseUrl}/ods/${id}`, m)) return true;
      return false;
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/ods/${id}`)) return true;
      return false;
    },
    async filterODS(f) {
      this.tempODS = { loading: true };
      try {
        if (!this.ODS.length) {
          await this.getAll();
        }
        this.tempODS = f
          ? this.ODS.filter((u) => (f.textualSearch
            ? (u.descricao + u.titulo + u.numero).toLowerCase()
              .includes(f.textualSearch.toLowerCase())
            : 1))
          : this.ODS;
      } catch (error) {
        this.tempODS = { error };
      }
    },
  },
});
