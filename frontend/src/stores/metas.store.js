import { usePdMStore } from '@/stores/pdm.store';
import { defineStore } from 'pinia';
import { usePlanosSetoriaisStore } from './planosSetoriais.store.ts';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return 'meta';
    case 'planoSetorial':
    case 'programaDeMetas':
      return 'plano-setorial-meta';
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

export const useMetasStore = (() => {
  console.warn('Obsoleto: prefira `metasPs.store.ts`');

  return defineStore('Metas', {
    state: () => ({
      Metas: {},
      tempMetas: {},
      singleMeta: {},
      groupedMetas: {},
      relacionadosMeta: {},
    }),
    getters: {
      activePdm() {
        switch (this.route.meta.entidadeMãe) {
          case 'pdm':
            return usePdMStore().activePdm;
          case 'planoSetorial':
          case 'programaDeMetas':
            return usePlanosSetoriaisStore(this.route.meta.entidadeMãe).emFoco || {};
          default:
            throw new Error('Erro ao buscar PdM ativo');
        }
      },
    },
    actions: {
      clear() {
        this.Metas = {};
        this.tempMetas = {};
        this.groupedMetas = {};
        this.singleMeta = {};
      },
      clearEdit() {
        this.singleMeta = {};
      },
      waitFor(resolve, reject) {
        if (!this.Metas.loading) resolve(1);
        else setTimeout(this.waitFor.bind(this, resolve, reject), 300);
      },
      async getPdM() {
        const PdMStore = usePdMStore();
        if (!this.activePdm.id) {
          await PdMStore.getActive();
        }
        return this.activePdm;
      },
      async getfilteredMetasByPdM(pdmId) {
        try {
          if (!pdmId) {
            throw new Error('ID do PdM não fornecido.');
          }
          const response = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}?pdm_id=${pdmId}`);
          this.Metas = response.linhas;
          return true;
        } catch (error) {
          console.error('Erro ao filtrar metas por pdm_id:', error);
          throw error;
        }
      },
      async getAll() {
        try {
          if (this.Metas.loading) {
            await new Promise(this.waitFor);
          } else {
            this.Metas = { loading: true };
            const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}?pdm_id=${this.activePdm.id || this.route.params.planoSetorialId}`);
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
          const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`);
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
          const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}/iniciativas-atividades/?meta_ids="${id}"`);
          this.singleMeta.children = r.linhas ? r.linhas : [];
          return true;
        } catch (error) {
          this.singleMeta = { error };
          return false;
        }
      },
      async insert(params) {
        if (await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta)}`, params)) return true;
        return false;
      },
      async update(id, params) {
        if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`, params)) return true;
        return false;
      },
      async delete(id) {
        if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`)) return true;
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
              if (tt && ct && f.filteredId) {
                r = u[f.groupBy].id == f.filteredId;
              }
              return r;
            });

            if (f.tagId) {
              this.tempMetas = this.tempMetas
                .filter((x) => Array.isArray(x.tags) && x.tags.some((y) => y.id === f.tagId));
            }
            if (f.órgãoId) {
              this.tempMetas = this.tempMetas
                .filter((x) => Array.isArray(x.orgaos_participantes)
              && x.orgaos_participantes.some((y) => y.orgao?.id === f.órgãoId));
            }
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
})();
