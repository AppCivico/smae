import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useCronogramasStore = defineStore({
    id: 'Cronogramas',
    state: () => ({
        Cronogramas: {},
        singleCronograma: {}
    }),
    actions: {
        clear (){
            this.Cronogramas = {};
            this.singleCronograma = {};
        },
        clearEdit (){
            this.singleCronograma = {};
        },
        async getAll(p_id,parent_field) {
            try {
                this.Cronogramas[p_id] = { loading: true };
                let r = await requestS.get(`${baseUrl}/cronograma?${parent_field}=${p_id}`);    
                this.Cronogramas[p_id] = r.linhas.map(x=>{
                    return x;
                });
            } catch (error) {
                this.Cronogramas[p_id] = { error };
            }
        },
        async getById(p_id,parent_field,cronograma_id) {
            try {
                if(!cronograma_id) throw "Cronograma inválida";
                this.singleCronograma = { loading: true };
                await this.getAll(p_id,parent_field);
                this.singleCronograma = this.Cronogramas[p_id].length? this.Cronogramas[p_id].find((u)=>u.id == cronograma_id):{};
                return true;
            } catch (error) {
                this.singleCronograma = { error };
            }
        },
        async insert(params) {
            let r = await requestS.post(`${baseUrl}/cronograma`, params);
            if(r.id) return r.id;
            return false;
        },
        async update(id, params) {
            if(await requestS.patch(`${baseUrl}/cronograma/${id}`, params)) return true;
            return false;
        },
        async delete(cronograma_id) {
            if(await requestS.delete(`${baseUrl}/cronograma/${cronograma_id}`)){
                return true;
            }
            return false;
        },
    }
});
