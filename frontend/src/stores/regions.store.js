import createDataTree from '@/helpers/createDataTree.ts';
import flatten from '@/helpers/flatDataTree';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useRegionsStore = defineStore({
  id: 'regions',
  state: () => ({
    listregions: {},
    regions: {},
    tempRegions: {},
    singleTempRegions: {},
    camadas: null,
    chamadasPendentes: {
      camadas: false,
    },
    erros: {
      camadas: null,
    },
  }),
  actions: {
    // PRA-FAZER: trocar essa função redundante por $reset()
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
        const r = await this.requestS.get(`${baseUrl}/regiao`);
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
      if (await this.requestS.post(`${baseUrl}/regiao`, m)) {
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
        await this.requestS.patch(`${baseUrl}/regiao/${id}`, m);

        // devido a inconsistências no envio, é mais seguro não usar a carga
        // da requisição para atualizar o objeto
        this.getAll();
        return true;
      } catch (error) {
        return false;
      }
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/regiao/${id}`)) {
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
    async buscarCamadas(ids) {
      this.chamadasPendentes.camadas = true;
      this.erros.camadas = null;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/camada`, { camada_ids: ids });

        if (!this.camadas) {
          this.camadas = {};
        }

        if (!Array.isArray(linhas)) {
          throw new Error('resposta de `/camadas` fora do padrão esperado');
        } else {
          for (let i = 0; i < linhas.length; i += 1) {
            const camada = linhas[i];
            this.camadas[camada.id] = camada;
          }
        }
      } catch (error) {
        this.erros.camadas = error;
      } finally {
        this.chamadasPendentes.camadas = false;
      }
    },
  },
  getters: {
    regiõesEmLista: (({ regions }) => (regions && Array.isArray(regions) ? flatten(regions) : [])),
    regiõesPorNível() {
      return this.regiõesEmLista.reduce((acc, cur) => ({
        ...acc,
        [cur.nivel]: [
          ...(acc[cur.nivel] || []),
          cur,
        ],
      }), {});
    },
    regiõesPorNívelOrdenadas() {
      return Object.keys(this.regiõesPorNível)
        .reduce((acc, cur) => ({
          ...acc,
          [cur]: this.regiõesPorNível[cur]
            .sort((a, b) => a.descricao.localeCompare(b.descricao)),
        }), {});
    },
  },
});
