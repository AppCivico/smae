import { requestS } from '@/helpers';
import createDataTree from '@/helpers/createDataTree';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useRegionsStore = defineStore({
  id: 'regions',
  state: () => ({
    listregions: {},
    regions: {},
    tempRegions: {},
    singleTempRegions: {},
  }),
  actions: {
    clear() {
      this.regions = {};
      this.tempRegions = {};
      this.singleTempRegions = {};
    },
    clearEdit() {
      this.singleTempRegions = {};
    },
    compareFilter(item, nome, rid) {
      let r = 0;
      if (rid) r = item.id == rid;
      if (nome) r = item.descricao.toLowerCase().includes(nome);
      return r;
    },
    async getAll() {
      this.regions = { loading: true };
      try {
        const r = await requestS.get(`${baseUrl}/regiao`);
        this.listregions = r.linhas;
        if (Array.isArray(r.linhas)) {
          this.regions = createDataTree(r.linhas, 'parente_id');
        } else {
          this.regions = r.linhas;
        }
      } catch (error) {
        this.regions = { error };
      }
    },
    async getById(id) {
      this.singleTempRegions = { loading: true };
      try {
        if (!this.listregions.length) {
          await this.getAll();
        }
        this.singleTempRegions = this.listregions.find((u) => u.id == id);
        if (!this.singleTempRegions) throw 'Item não encontrado';
      } catch (error) {
        this.singleTempRegions = { error };
      }
    },
    async insert(params) {
      const m = {
        nivel: Number(params.nivel),
        parente_id: params.parente_id ? Number(params.parente_id) : null,
        descricao: params.descricao,
      };
      if (params.upload_shapefile)m.upload_shapefile = params.upload_shapefile;
      if (await requestS.post(`${baseUrl}/regiao`, m)) {
        this.getAll();
        return true;
      }
      return false;
    },
    async update(id, params) {
      const m = {
        // nivel: Number(params.nivel),
        parente_id: params.parente_id ? Number(params.parente_id) : null,
        descricao: params.descricao,
      };
      if (params.upload_shapefile) {
        m.upload_shapefile = params.upload_shapefile;
      }

      try {
        await requestS.patch(`${baseUrl}/regiao/${id}`, m);

        // devido a inconsistências no envio, é mais seguro não usar a carga
        // da requisição para atualizar o objeto
        this.getAll();
        return true;
      } catch (error) {
        return false;
      }
    },
    async delete(id) {
      if (await requestS.delete(`${baseUrl}/regiao/${id}`)) {
        this.$patch({
          regions: this.regions.filter(function removerRegião(x) {
            if (x.id == id) {
              return false;
            }
            if (Array.isArray(x.children)) {
              // eslint-disable-next-line no-param-reassign
              x.children = x.children.filter(removerRegião);
            }
            return true;
          }),
        });

        return true;
      }
      return false;
    },
    async filterRegions(f) {
      if (!this.tempRegions.length) this.tempRegions = { loading: true };
      try {
        if (!this.regions.length) await this.getAll();

        const x = JSON.parse(JSON.stringify(this.regions));
        if (f?.textualSearch || f?.id) {
          const nome = f.textualSearch ? f.textualSearch.toLowerCase() : false;
          const rid = f.id ? f.id : false;

          this.tempRegions = x.reduce((a, u, i) => {
            if (this.compareFilter(u, nome, rid)) { u.index = i; a.push(u); return a; }
            let ru = 0;
            if (u.children.length) {
              u.children = u.children.reduce((aa, uu, ii) => {
                if (this.compareFilter(uu, nome, rid)) { uu.index = ii; aa.push(uu); ru = 1; return aa; }
                let ruu = 0;
                if (uu.children.length) {
                  uu.children = uu.children.reduce((aaa, uuu, iii) => {
                    if (this.compareFilter(uuu, nome, rid)) { uuu.index = iii; aaa.push(uuu); ruu = 1; return aaa; }
                    let ruuu = 0;
                    if (uuu.children.length) {
                      uuu.children = uuu.children.reduce((aaaa, uuuu, iiii) => {
                        if (this.compareFilter(uuuu, nome, rid)) { uuuu.index = iiii; aaaa.push(uuuu); ruuu = 1; return aaaa; }
                        return aaaa;
                      }, []);
                    }
                    if (ruuu) { uuu.index = iii; aaa.push(uuu); ruu = 1; }
                    return aaa;
                  }, []);
                }
                if (ruu) { uu.index = ii; aa.push(uu); ru = 1; }
                return aa;
              }, []);
            }
            if (ru) { u.index = i; a.push(u); }
            return a;
          }, []);
        } else {
          this.tempRegions = x;
        }
      } catch (error) {
        this.tempRegions = { error };
      }
    },
  },
});
