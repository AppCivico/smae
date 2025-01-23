import { useODSStore } from '@/stores/ods.store';
import { usePdMStore } from '@/stores/pdm.store';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return 'tag';
    case 'planoSetorial':
    case 'programaDeMetas':
      return 'plano-setorial-tag';
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

export const useTagsStore = defineStore({
  id: 'Tags',
  state: () => ({
    Tags: {},
    tempTags: {},
  }),
  actions: {
    clear() {
      this.Tags = {};
      this.tempTags = {};
    },
    async getAll() {
      try {
        if (this.Tags.loading) return;
        this.Tags = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}`);
        if (r.linhas.length) {
          const PdMStore = usePdMStore();
          const ODSStore = useODSStore();
          if (!PdMStore.PdM.length) await PdMStore.getAll();
          if (!ODSStore.ODS.length) await ODSStore.getAll();
          this.Tags = r.linhas.map((x) => {
            x.pdm = x.pdm_id && PdMStore.PdM.length
              ? PdMStore.PdM.find((z) => z.id == x.pdm_id)
              : null;
            x.ods = x.ods_id
              ? ODSStore.ODS.find((z) => z.id == x.ods_id)
              : null;
            return x;
          });
        } else {
          this.Tags = r.linhas;
        }
      } catch (error) {
        this.Tags = { error };
      }
    },
    async getAllSimple() {
      this.Tags = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}`);
        if (r.linhas.length) {
          const ODSStore = useODSStore();
          await ODSStore.getAll();
          this.Tags = r.linhas.map((x) => {
            x.ods = ODSStore.ODS.find((z) => z.id == x.ods_id);
            return x;
          });
        } else {
          this.Tags = r.linhas;
        }
      } catch (error) {
        this.Tags = { error };
      }
    },
    async getById(id) {
      this.tempTags = { loading: true };
      try {
        if (!this.Tags.length) {
          await this.getAll();
        }
        this.tempTags = this.Tags.find((u) => u.id == id);
        if (!this.tempTags) throw 'Tags não encontrada';
      } catch (error) {
        this.tempTags = { error };
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
    async filterTags(f) {
      this.tempTags = { loading: true };
      try {
        if (!this.Tags.length) {
          await this.getAll();
        }
        this.tempTags = f && this.Tags.length
          ? this.Tags.filter((u) => (f.textualSearch
            ? (u.descricao + u.titulo + u.numero)
              .toLowerCase()
              .includes(f.textualSearch.toLowerCase())
            : 1))
          : this.Tags;
      } catch (error) {
        this.tempTags = { error };
      }
    },
    async filterByPdm(pdm_id) {
      this.tempTags = { loading: true };
      try {
        await this.getAll();

        this.tempTags = this.Tags.length ? this.Tags.filter((u) => u.pdm_id == pdm_id) : [];
      } catch (error) {
        this.tempTags = { error };
      }
    },
  },

  getters: {
    // melhor filtrar na busca do que usar essa função, que não tem cache
    filtradasPorPdM: ({ Tags }) => (pdmId) => (Tags.length
      ? Tags.filter((x) => x.pdm_id == pdmId)
      : []),
    tagsPorPlano: ({ Tags }) => (Array.isArray(Tags)
      ? Tags.reduce((acc, tag) => {
        if (!acc[tag.pdm_id]) {
          acc[tag.pdm_id] = [];
        }
        acc[tag.pdm_id].push(tag);
        return acc;
      }, {})
      : {}),
  },
});
