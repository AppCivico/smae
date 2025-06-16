import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const usePaineisGruposStore = defineStore('PaineisGrupos', {
  state: () => ({
    PaineisGrupos: {},
    tempPaineisGrupos: {},
    singlePaineisGrupos: {},
  }),
  actions: {
    clear() {
      this.PaineisGrupos = {};
      this.tempPaineisGrupos = {};
      this.singlePaineisGrupos = {};
    },
    async getAll() {
      this.PaineisGrupos = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/grupo-paineis`);
        this.PaineisGrupos = r.linhas;
      } catch (error) {
        this.PaineisGrupos = { error };
      }
    },
    async getById(id) {
      this.singlePaineisGrupos = { loading: true };
      try {
        if (!this.PaineisGrupos.length) {
          await this.getAll();
        }
        const r = this.PaineisGrupos.find((u) => u.id == id);
        if (r.id) {
          r.ativo = r.ativo ? '1' : false;
          this.singlePaineisGrupos = r;
        } else {
          throw 'Tipo de documento não encontrado';
        }
      } catch (error) {
        this.singlePaineisGrupos = { error };
      }
    },
    async insert(params) {
      if (await this.requestS.post(`${baseUrl}/grupo-paineis`, params)) return true;
      return false;
    },
    async update(id, params) {
      if (await this.requestS.patch(`${baseUrl}/grupo-paineis/${id}`, params)) return true;
      return false;
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/grupo-paineis/${id}`)) return true;
      return false;
    },
    async filterPaineisGrupos(f) {
      this.tempPaineisGrupos = { loading: true };
      try {
        if (!this.PaineisGrupos.length) {
          await this.getAll();
        }
        this.tempPaineisGrupos = f ? this.PaineisGrupos.filter((u) => (f.textualSearch ? (u.nome).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1)) : this.PaineisGrupos;
      } catch (error) {
        this.tempPaineisGrupos = { error };
      }
    },
  },
});
