import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useODSStore = defineStore({
    id: 'ODS',
    state: () => ({
        ODS: {},
        tempODS: {},
    }),
    actions: {
        clear (){
            this.ODS = {};
            this.tempODS = {};
        },
        async getAll() {
            this.ODS = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/ods`);    
                this.ODS = r.linhas;
            } catch (error) {
                this.ODS = { error };
            }
        },
        async getById(id) {
            this.tempODS = { loading: true };
            try {
                if(!this.ODS.length){
                    await this.getAll();
                }
                this.tempODS = this.ODS.find((u)=>u.id == id);
                if(!this.tempODS) throw 'ODS não encontrada';
            } catch (error) {
                this.tempODS = { error };
            }
        },
        async insert(params) {
            await requestS.post(`${baseUrl}/ods`, params);
            return true;
        },
        async update(id, params) {
            var m = {
                numero: params.numero,
                titulo: params.titulo,
                descricao: params.descricao
            };
            await requestS.patch(`${baseUrl}/ods/${id}`, m);
            return true;
        },
        async delete(id) {
            await requestS.delete(`${baseUrl}/ods/${id}`);
            return true;
        },
        async filterODS(f){
            this.tempODS = { loading: true };
            try {
                if(!this.ODS.length){
                    await this.getAll();
                }
                this.tempODS = f ? this.ODS.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.ODS;
            } catch (error) {
                this.tempODS = { error };
            }
        },
    }
});
