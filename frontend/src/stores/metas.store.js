import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { usePdMStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useMetasStore = defineStore({
    id: 'Metas',
    state: () => ({
        Metas: {},
        tempMetas: {},
        singleMeta: {},
        activePdm: {},
        groupedMetas: {}
    }),
    actions: {
        clear (){
            this.Metas = {};
            this.tempMetas = {};
            this.groupedMetas = {};
            this.singleMeta = {};
            this.activePdm = {};
        },
        clearEdit (){
            this.singleMeta = {};
            this.activePdm = {};
        },
        async getPdM() {
            this.activePdm = {};
            const PdMStore = usePdMStore();
            if(!PdMStore.activePdm.id){
                await PdMStore.getActive();
            }
            this.activePdm = PdMStore.activePdm;
            return this.activePdm;
        },
        async getAll() {
            try {
                if(!this.activePdm.id) await this.getPdM();
                if(this.Metas.loading) return;
                this.Metas = { loading: true };
                let r = await requestS.get(`${baseUrl}/meta?pdm_id=${this.activePdm.id}`);    
                this.Metas = r.linhas;
            } catch (error) {
                this.Metas = { error };
            }
        },
        async getById(id) {
            this.singleMeta = { loading: true };
            try {
                if(!this.Metas.length){
                    await this.getAll();
                }
                this.singleMeta = this.Metas.find((u)=>u.id == id);
                if(!this.singleMeta) throw 'Meta não encontrada';
                return true;
            } catch (error) {
                this.singleMeta = { error };
                return true;
            }
        },
        async insert(params) {
            if(await requestS.post(`${baseUrl}/meta`, params)) return true;
            return false;
        },
        async update(id, params) {
            if(await requestS.patch(`${baseUrl}/meta/${id}`, params)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/meta/${id}`)) return true;
            return false;
        },
        async filterMetas(f){
            this.tempMetas = { loading: true };
            try {
                this.groupedMetas = {loading: true };
                await this.getAll();
                if(!f){
                    this.tempMetas = this.Metas;
                }else{
                    var tt = ['tema','sub_tema','macro_tema'].includes(f.groupBy);
                    var ct = this.activePdm['possui_'+f.groupBy];
                    this.tempMetas = this.Metas.filter((u)=>{
                        var r = 1;
                        if(tt && ct && f.currentFilter){
                            r = u[f.groupBy].id==f.currentFilter;
                        }
                        return r;
                    });
                }
                var g = f.groupBy??'macro_tema';
                this.groupedMetas = Object.values(this.tempMetas.reduce((r, u) => {
                    if(!r[u[g].id]){
                        r[u[g].id] = u[g];
                        r[u[g].id].children = [];
                    }
                    r[u[g].id].children.push(u);
                    return r;
                }, {}));
            } catch (error) {
                this.tempMetas = { error };
                this.groupedMetas = { error };
            }
        },
    }
});
