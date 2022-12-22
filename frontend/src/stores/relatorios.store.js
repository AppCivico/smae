import { requestS } from '@/helpers';
import { defineStore } from 'pinia';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useRelatoriosStore = defineStore('relatorios', {
    state: () => ({
        relatorios: [],
        current: {
          fonte: '',
          parametros: {
            tipo: 'Analitico',
            pdm_id: 0,
            meta_id: 0,
            tags: [],
            inicio: '',
            fim: '',
            orgaos: [],
          },
          salvar_arquivo: true,
        },
        loading: true,
        error: false,
    }),
    actions: {
        clear (){
            this.relatorios = {};
        },
        async getAll(params = {}) {
            this.loading = true;
            try {
              let r = await requestS.get(`${baseUrl}/relatorios`, params);
                this.relatorios = r.linhas;
            } catch (error) {
                this.error = error;
            }
        },
        async getById(id) {
        },
        async insert(params) {
            if(await requestS.post(`${baseUrl}/relatorios`, params)) return true;
            return false;
        },

        async update(id, params) {
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/relatorios/${id}`)) {
              this.relatorios = this.relatorios.filter(x => x.id != id);
              return true;
            }
            return false;
        },
    }
});
