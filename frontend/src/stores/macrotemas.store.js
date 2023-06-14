import { usePdMStore } from '@/stores/pdm.store';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useMacrotemasStore = defineStore({
  id: 'Macrotemas',
  state: () => ({
    Macrotemas: {},
    tempMacrotemas: {},
  }),
  actions: {
    clear() {
      this.Macrotemas = {};
      this.tempMacrotemas = {};
    },
    async getAll() {
      try {
        if (this.Macrotemas.loading) return;
        this.Macrotemas = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/macrotema`);
        if (r.linhas.length) {
          const PdMStore = usePdMStore();
          if (!PdMStore.PdM.length) await PdMStore.getAll();
          this.Macrotemas = r.linhas.map((x) => {
            x.pdm = PdMStore.PdM.find((z) => z.id == x.pdm_id);
            return x;
          });
        } else {
          this.Macrotemas = r.linhas;
        }
      } catch (error) {
        this.Macrotemas = { error };
      }
    },
    async getAllSimple() {
      this.Macrotemas = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/macrotema`);
        this.Macrotemas = r.linhas;
      } catch (error) {
        this.Macrotemas = { error };
      }
    },
    async getById(id) {
      this.tempMacrotemas = { loading: true };
      try {
        if (!this.Macrotemas.length) {
          await this.getAllSimple();
        }
        this.tempMacrotemas = this.Macrotemas.length ? this.Macrotemas.find((u) => u.id == id) : {};
        if (!this.tempMacrotemas) throw 'Macrotemas não encontrada';
      } catch (error) {
        this.tempMacrotemas = { error };
      }
    },
    async insert(params) {
      const m = {
        pdm_id: Number(params.pdm_id),
        descricao: params.descricao,
      };
      if (await this.requestS.post(`${baseUrl}/macrotema`, m)) return true;
      return false;
    },
    async update(id, params) {
      const m = {
        pdm_id: Number(params.pdm_id),
        descricao: params.descricao,
      };
      if (await this.requestS.patch(`${baseUrl}/macrotema/${id}`, m)) return true;
      return false;
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/macrotema/${id}`)) return true;
      return false;
    },
    async filterMacrotemas(f) {
      this.tempMacrotemas = { loading: true };
      try {
        if (!this.Macrotemas.length) {
          await this.getAll();
        }
        this.tempMacrotemas = f ? this.Macrotemas.filter((u) => (f.textualSearch ? (u.descricao + u.titulo + u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1)) : this.Macrotemas;
      } catch (error) {
        this.tempMacrotemas = { error };
      }
    },
    async filterByPdm(pdm_id) {
      this.tempMacrotemas = { loading: true };
      try {
        if (!this.Macrotemas.length) {
          await this.getAllSimple();
        }
        this.tempMacrotemas = this.Macrotemas.filter((u) => u.pdm_id == pdm_id);
      } catch (error) {
        this.tempMacrotemas = { error };
      }
    },
  },
});
