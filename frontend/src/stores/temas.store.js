import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { usePdMStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useTemasStore = defineStore({
    id: 'Temas',
    state: () => ({
        Temas: {},
        tempTemas: {},
    }),
    actions: {
        clear (){
            this.Temas = {};
            this.tempTemas = {};
        },
        async getAll() {
            this.Temas = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/tema`);    
                if(r.linhas.length){
                    const PdMStore = usePdMStore();
                    await PdMStore.getAll();
                    this.Temas = r.linhas.map(x=>{
                        x.pdm = PdMStore.PdM.find(z=>z.id==x.pdm_id);
                        return x;
                    });
                }else{
                    this.Temas = r.linhas;
                }
            } catch (error) {
                this.Temas = { error };
            }
        },
        async getAllSimple() {
            this.Temas = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/tema`);    
                this.Temas = r.linhas;
            } catch (error) {
                this.Temas = { error };
            }
        },
        async getById(id) {
            this.tempTemas = { loading: true };
            try {
                if(!this.Temas.length){
                    await this.getAll();
                }
                this.tempTemas = this.Temas.find((u)=>u.id == id);
                if(!this.tempTemas) throw 'Tipo de documento não encontrado';
            } catch (error) {
                this.tempTemas = { error };
            }
        },
        async insert(params) {
            if(await requestS.post(`${baseUrl}/tema`, params)) return true;
            return false;
        },
        async update(id, params) {
            var m = {
                pdm_id: params.pdm_id,
                descricao: params.descricao,
            };
            if(await requestS.patch(`${baseUrl}/tema/${id}`, m)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/tema/${id}`)) return true;
            return false;
        },
        async filterTemas(f){
            this.tempTemas = { loading: true };
            try {
                if(!this.Temas.length){
                    await this.getAll();
                }
                this.tempTemas = f ? this.Temas.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.codigo+u.extensoes).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.Temas;
            } catch (error) {
                this.tempTemas = { error };
            }
        },
        async filterByPdm(pdm_id){
            this.tempTemas = { loading: true };
            try {
                if(!this.Temas.length){
                    await this.getAll();
                }
                this.tempTemas = this.Temas.filter((u)=>{
                    return u.pdm_id == pdm_id;
                });
            } catch (error) {
                this.tempTemas = { error };
            }
        }
    }
});
