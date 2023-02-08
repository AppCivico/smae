import { requestS } from '@/helpers';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAtividadesStore = defineStore({
  id: 'Atividades',
  state: () => ({
    Atividades: {},
    singleAtividade: {},
  }),
  actions: {
    clear() {
      this.Atividades = {};
      this.singleAtividade = {};
    },
    clearEdit() {
      this.singleAtividade = {};
    },
    async getAll(iniciativa_id) {
      try {
        if (!iniciativa_id) throw 'Iniciativa inválida';
        if (!this.Atividades[iniciativa_id]?.length) {
          this.Atividades[iniciativa_id] = { loading: true };
        }
        const r = await requestS.get(`${baseUrl}/atividade?iniciativa_id=${iniciativa_id}`);

        this.Atividades[iniciativa_id] = r.linhas.map((x) => {
          x.compoe_indicador_iniciativa = x.compoe_indicador_iniciativa ? '1' : false;
          return x;
        });
        return true;
      } catch (error) {
        this.Atividades[iniciativa_id] = { error };
        return false;
      }
    },
    async getById(iniciativa_id, atividade_id) {
      try {
        if (!iniciativa_id) throw 'Iniciativa inválida';
        if (!atividade_id) throw 'Atividade inválida';
        this.singleAtividade = { loading: true };
        if (!this.Atividades[iniciativa_id]?.length) {
          await this.getAll(iniciativa_id);
        }
        this.singleAtividade = this.Atividades[iniciativa_id].length
          ? this.Atividades[iniciativa_id].find((u) => u.id == atividade_id)
          : {};
        return true;
      } catch (error) {
        this.singleAtividade = { error };
        return false;
      }
    },
    async insert(params) {
      const r = await requestS.post(`${baseUrl}/atividade`, params);
      if (r.id) return r.id;
      return false;
    },
    async update(id, params) {
      if (await requestS.patch(`${baseUrl}/atividade/${id}`, params)) return true;
      return false;
    },
    async delete(iniciativa_id, atividade_id) {
      if (await requestS.delete(`${baseUrl}/atividade/${atividade_id}`)) {
        this.Atividades[iniciativa_id] = {};
        this.getAll(iniciativa_id);
        return true;
      }
      return false;
    },
  },
});
