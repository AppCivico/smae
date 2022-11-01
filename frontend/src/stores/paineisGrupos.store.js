import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const usePaineisGruposStore = defineStore({
    id: 'PaineisGrupos',
    state: () => ({
        PaineisGrupos: {},
        tempPaineisGrupos: {},
        singlePaineisGrupos: {}
    }),
    actions: {
        clear (){
            this.PaineisGrupos = {};
            this.tempPaineisGrupos = {};
            this.singlePaineisGrupos = {};
        },
        async getAll() {
            this.PaineisGrupos = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/grupo-paineis`);    
                this.PaineisGrupos = r.linhas;
            } catch (error) {
                this.PaineisGrupos = { error };
            }
        },
        async getById(id) {
            this.singlePaineisGrupos = { loading: true };
            try {
                if(!this.PaineisGrupos.length){
                    await this.getAll();
                }
                this.singlePaineisGrupos = this.PaineisGrupos.find((u)=>u.id == id);
                if(!this.singlePaineisGrupos) throw 'Tipo de documento não encontrado';
            } catch (error) {
                this.singlePaineisGrupos = { error };
            }
        },
        async insert(params) {
            if(await requestS.post(`${baseUrl}/grupo-paineis`, params)) return true;
            return false;
        },
        async update(id, params) {
            if(await requestS.patch(`${baseUrl}/grupo-paineis/${id}`, params)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/grupo-paineis/${id}`)) return true;
            return false;
        },
        async filterPaineisGrupos(f){
            this.tempPaineisGrupos = { loading: true };
            try {
                if(!this.PaineisGrupos.length){
                    await this.getAll();
                }
                this.tempPaineisGrupos = f ? this.PaineisGrupos.filter((u)=>{
                    return f.textualSearch ? (u.nome).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.PaineisGrupos;
            } catch (error) {
                this.tempPaineisGrupos = { error };
            }
        },
    }
});
