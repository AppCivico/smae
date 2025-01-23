import { usePdMStore } from '@/stores/pdm.store';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return 'macrotema';
    case 'planoSetorial':
    case 'programaDeMetas':
      return 'plano-setorial-macrotema';
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

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
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}`);
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
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}`);
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
      if (await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta)}`, m)) return true;
      return false;
    },
    async update(id, params) {
      const m = {
        pdm_id: Number(params.pdm_id),
        descricao: params.descricao,
      };
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`, m)) return true;
      return false;
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`)) return true;
      return false;
    },
    async filterMacrotemas(f) {
      this.tempMacrotemas = { loading: true };
      try {
        if (!this.Macrotemas.length) {
          await this.getAll();
        }
        this.tempMacrotemas = f
          ? this.Macrotemas.filter((u) => (f.textualSearch
            ? (u.descricao + u.titulo + u.numero)
              .toLowerCase()
              .includes(f.textualSearch.toLowerCase())
            : 1))
          : this.Macrotemas;
      } catch (error) {
        this.tempMacrotemas = { error };
      }
    },
    async filterByPdm(pdm_id) {
      this.tempMacrotemas = { loading: true };
      try {
        await this.getAllSimple();

        this.tempMacrotemas = this.Macrotemas.filter((u) => u.pdm_id == pdm_id);
      } catch (error) {
        this.tempMacrotemas = { error };
      }
    },
  },
});
