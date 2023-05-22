import { requestS } from '@/helpers';
import { useUsersStore } from '@/stores';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useOrgansStore = defineStore({
  id: 'organs',
  state: () => ({
    organs: {},
    tempOrgans: {},
    organTypes: {},
    tempOrganTypes: {},
    organResponsibles: {},
  }),
  actions: {
    clear() {
      this.organs = {};
      this.tempOrgans = {};
      this.organTypes = {};
      this.tempOrganTypes = {};
      this.organResponsibles = {};
    },
    async getAll() {
      try {
        if (this.organs.loading) return;
        this.organs = { loading: true };
        const r = await requestS.get(`${baseUrl}/orgao`);
        this.organs = r.linhas;
      } catch (error) {
        this.organs = { error };
      }
    },
    async getById(id) {
      this.tempOrgans = { loading: true };
      try {
        if (!this.organs.length) {
          await this.getAll();
        }
        this.tempOrgans = this.organs.find((u) => u.id == id);
        this.tempOrgans.tipo_orgao_id = this.tempOrgans.tipo_orgao.id;
        if (!this.tempOrgans) {
          throw new Error('Orgão não encontrado');
        }
      } catch (error) {
        this.tempOrgans = { error };
      }
    },
    async insert(params) {
      if (await requestS.post(`${baseUrl}/orgao`, params)) return true;
      return false;
    },
    async update(id, params) {
      const m = {
        sigla: params.sigla,
        descricao: params.descricao,
        tipo_orgao_id: params.tipo_orgao_id,
      };
      if (await requestS.patch(`${baseUrl}/orgao/${id}`, m)) return true;
      return false;
    },
    async delete(id) {
      if (await requestS.delete(`${baseUrl}/orgao/${id}`)) return true;
      return false;
    },
    async filterOrgans(f) {
      this.tempOrgans = { loading: true };
      try {
        if (!this.organs.length) {
          await this.getAll();
        }
        this.tempOrgans = f
          ? this.organs
            .filter((u) => (f.textualSearch
              ? u.descricao.toLowerCase().includes(f.textualSearch.toLowerCase())
              || u.tipo_orgao.descricao.toLowerCase().includes(f.textualSearch.toLowerCase())
              : 1))
          : this.organs;
      } catch (error) {
        this.tempOrgans = { error };
      }
    },
    async getAllTypes() {
      this.organTypes = { loading: true };
      try {
        const r = await requestS.get(`${baseUrl}/tipo-orgao`);
        this.organTypes = r.linhas;
      } catch (error) {
        this.organTypes = { error };
      }
    },
    async getByIdTypes(id) {
      this.tempOrganTypes = { loading: true };
      try {
        if (!this.organTypes.length) {
          await this.getAllTypes();
        }
        this.tempOrganTypes = this.organTypes.find((u) => u.id == id);
        if (!this.tempOrganTypes) {
          throw new Error('Orgão não encontrado');
        }
      } catch (error) {
        this.tempOrganTypes = { error };
      }
    },
    async insertType(params) {
      if (await requestS.post(`${baseUrl}/tipo-orgao`, params)) return true;
      return false;
    },
    async updateType(id, params) {
      const m = {
        descricao: params.descricao,
      };
      if (await requestS.patch(`${baseUrl}/tipo-orgao/${id}`, m)) return true;
      return false;
    },
    async deleteType(id) {
      if (await requestS.delete(`${baseUrl}/tipo-orgao/${id}`)) return true;
      return false;
    },
    async filterOrganTypes(f) {
      this.tempOrganTypes = { loading: true };
      try {
        if (!this.organTypes.length) {
          await this.getAllTypes();
        }
        this.tempOrganTypes = f
          ? this.organTypes
            .filter((u) => (f.textualSearch
              ? u.descricao.toLowerCase().includes(f.textualSearch.toLowerCase())
              : 1
            ))
          : this.organTypes;
      } catch (error) {
        this.tempOrganTypes = { error };
      }
    },
    async getAllOrganResponsibles() {
      try {
        const usersStore = useUsersStore();
        this.organResponsibles = { loading: true };

        if (!this.organs.length) await this.getAll();
        if (!usersStore.users.length) await usersStore.getAll();
        this.organResponsibles = this.organs.length
          ? this.organs.map((o) => {
            o.responsible = usersStore.users.length
              ? usersStore.users
                .filter((u) => u.orgao_id == o.id)
              : null;
            return o;
          })
            .filter((a) => a.responsible.length)
          : this.organs;
      } catch (error) {
        this.organResponsibles = { error };
      }
    },
  },
  getters: {
    // código legado. Originalmente os órgãos não eram ordenados
    órgãosOrdenados: ({ organs }) => (Array.isArray(organs)
      ? organs
      : []),
    órgãosPorId: ({ organs }) => (Array.isArray(organs)
      ? organs.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {})
      : {}),
    órgãosQueTemResponsáveis() {
      return this.órgãosOrdenados.filter((x) => x.responsible?.length);
    },
    órgãosQueTemResponsáveisEPorId() {
      return this.órgãosQueTemResponsáveis
        .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {});
    },
  },
});
