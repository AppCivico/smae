import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useResourcesStore = defineStore({
    id: 'resources',
    state: () => ({
        resources: {},
        tempResources: {},
    }),
    actions: {
        clear (){
            this.resources = {};
            this.tempResources = {};
        },
        async getAll() {
            this.resources = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/fonte-recurso`);    
                this.resources = r.linhas;
            } catch (error) {
                this.resources = { error };
            }
        },
        async getById(id) {
            this.tempResources = { loading: true };
            try {
                if(!this.resources.length){
                    await this.getAll();
                }
                this.tempResources = this.resources.find((u)=>u.id == id);
                if(!this.tempResources) throw 'Fonte de recurso não encontrada';
            } catch (error) {
                this.tempResources = { error };
            }
        },
        async insertType(params) {
            if(await requestS.post(`${baseUrl}/fonte-recurso`, params)) return true;
            return false;
        },
        async updateType(id, params) {
            var m = {
                sigla: params.sigla,
                fonte: params.fonte,
            };
            if(await requestS.patch(`${baseUrl}/fonte-recurso/${id}`, m)) return true;
            return false;
        },
        async deleteType(id) {
            if(await requestS.delete(`${baseUrl}/fonte-recurso/${id}`)) return true;
            return false;
        },
        async filterResources(f){
            this.tempResources = { loading: true };
            try {
                if(!this.resources.length){
                    await this.getAll();
                }
                this.tempResources = f ? this.resources.filter((u)=>{
                    return f.textualSearch ? (u.fonte+u.sigla).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.resources;
            } catch (error) {
                this.tempResources = { error };
            }
        },
    }
});
