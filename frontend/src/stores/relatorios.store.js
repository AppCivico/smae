import { requestS } from '@/helpers';
import { defineStore } from 'pinia';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useRelatoriosStore = defineStore({
    id: 'relatorios',
    state: () => ({
        relatorios: {},
        tempRelatorios: {},
    }),
    actions: {
        clear (){
            this.relatorios = {};
            this.tempRelatorios = {};
        },
        async getAll(params = {}) {
            this.relatorios = { loading: true };
            try {
              let r = await requestS.get(`${baseUrl}/relatorios`, params);
                this.relatorios = r.linhas;
            } catch (error) {
                this.relatorios = { error };
            }
        },
        async getById(id) {
            this.tempRelatorios = { loading: true };
            try {
                if(!this.relatorios.length){
                    await this.getAll();
                }
                this.tempRelatorios = this.relatorios.find((u)=>u.id == id);
                if(!this.tempRelatorios) throw 'Tipo de relatorioso não encontrado';
            } catch (error) {
                this.tempRelatorios = { error };
            }
        },
        async insert(params) {
            if(await requestS.post(`${baseUrl}/relatorios`, params)) return true;
            return false;
        },

        async update(id, params) {
            var m = {
                extensoes: params.extensoes,
                descricao: params.descricao,
                titulo: params.titulo,
                codigo: params.codigo
            };
            if(await requestS.patch(`${baseUrl}/relatorios/${id}`, m)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/relatorios/${id}`)) {
              this.relatorios = this.relatorios.filter(x => x.id != id);
              return true;
            }
            return false;
        },
        async filterRelatorios(f){
            this.tempRelatorios = { loading: true };
            try {
                if(!this.relatorios.length){
                    await this.getAll(f);
                }
                this.tempRelatorios = f ? this.relatorios.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.codigo+u.extensoes).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.relatorios;
            } catch (error) {
                this.tempRelatorios = { error };
            }
        },
    }
});
