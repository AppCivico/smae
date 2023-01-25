import { requestS } from '@/helpers';
import { usePdMStore } from '@/stores';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useMetasStore = defineStore({
  id: 'Metas',
  state: () => ({
    Metas: {},
    tempMetas: {},
    singleMeta: {},
    activePdm: {},
    groupedMetas: {},
  }),
  actions: {
    clear() {
      this.Metas = {};
      this.tempMetas = {};
      this.groupedMetas = {};
      this.singleMeta = {};
      this.activePdm = {};
    },
    clearEdit() {
      this.singleMeta = {};
      this.activePdm = {};
    },
    waitFor(resolve, reject) {
      if (!this.Metas.loading) resolve(1);
      else setTimeout(this.waitFor.bind(this, resolve, reject), 300);
    },
    async getPdM() {
      const PdMStore = usePdMStore();
      if (!PdMStore.activePdm.id) {
        await PdMStore.getActive();
      }
      this.activePdm = PdMStore.activePdm;
      return this.activePdm;
    },
    async getAll() {
      try {
        if (!this.activePdm.id) await this.getPdM();
        if (this.Metas.loading) {
          await new Promise(this.waitFor);
        } else {
          this.Metas = { loading: true };
          const r = await requestS.get(`${baseUrl}/meta?pdm_id=${this.activePdm.id}`);
          this.Metas = r.linhas;
        }
        return true;
      } catch (error) {
        this.Metas = { error };
        return false;
      }
    },
    async getById(id) {
      try {
        this.singleMeta = { loading: true };
        const r = await requestS.get(`${baseUrl}/meta/${id}`);
        this.singleMeta = r.id ? r : false;
        if (!this.singleMeta) throw 'Meta não encontrada';
        return true;
      } catch (error) {
        this.singleMeta = { error };
        return false;
      }
    },
    async getChildren(id) {
      try {
        if (!this.singleMeta.id) {
          await this.getById(id);
        }
        this.singleMeta.children = { loading: true };
        const r = await requestS.get(`${baseUrl}/meta/iniciativas-atividades/?meta_ids="${id}"`);
        this.singleMeta.children = r.linhas ? r.linhas : [];
        return true;
      } catch (error) {
        this.singleMeta = { error };
        return false;
      }
    },
    async insert(params) {
      if (await requestS.post(`${baseUrl}/meta`, params)) return true;
      return false;
    },
    async update(id, params) {
      if (await requestS.patch(`${baseUrl}/meta/${id}`, params)) return true;
      return false;
    },
    async delete(id) {
      if (await requestS.delete(`${baseUrl}/meta/${id}`)) return true;
      return false;
    },
    async filterMetas(f) {
      this.tempMetas = { loading: true };
      try {
        this.groupedMetas = { loading: true };
        await this.getAll();
        if (!f) {
          this.tempMetas = this.Metas;
        } else {
          const tt = ['tema', 'sub_tema', 'macro_tema'].includes(f.groupBy);
          const ct = this.activePdm[`possui_${f.groupBy}`];
          this.tempMetas = this.Metas.filter((u) => {
            let r = 1;
            if (tt && ct && f.currentFilter) {
              r = u[f.groupBy].id == f.currentFilter;
            }
            return r;
          });
        }
        const g = f.groupBy ?? 'macro_tema';
        if (this.activePdm[`possui_${g}`]) {
          this.groupedMetas = Object.values(this.tempMetas.reduce((r, u) => {
            if (!u[g]) u[g] = { descricao: '-', id: 0 };
            if (!r[u[g]?.id]) {
              r[u[g].id] = u[g];
              r[u[g].id].children = [];
            }
            r[u[g].id].children.push(u);
            return r;
          }, {}));
        } else {
          f.groupBy = 'todas';
          this.groupedMetas = [{
            id: 0,
            descricao: 'Todas as metas',
            children: this.tempMetas,
          }];
        }
      } catch (error) {
        this.tempMetas = { error };
        this.groupedMetas = { error };
      }
    },
  },
});
