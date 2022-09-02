import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { usePdMStore,useODSStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useTagsStore = defineStore({
    id: 'Tags',
    state: () => ({
        Tags: {},
        tempTags: {},
    }),
    actions: {
        clear (){
            this.Tags = {};
            this.tempTags = {};
        },
        async getAll() {
            this.Tags = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/tag`);    
                if(r.linhas.length){
                    const PdMStore = usePdMStore();
                    await PdMStore.getAll();
                    const ODSStore = useODSStore();
                    await ODSStore.getAll();
                    this.Tags = r.linhas.map(x=>{
                        x.pdm = PdMStore.PdM.find(z=>z.id==x.pdm_id);
                        x.ods = ODSStore.ODS.find(z=>z.id==x.ods_id);
                        return x;
                    });
                }else{
                    this.Tags = r.linhas;
                }
            } catch (error) {
                this.Tags = { error };
            }
        },
        async getAllSimple() {
            this.Tags = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/tag`);    
                if(r.linhas.length){
                    const ODSStore = useODSStore();
                    await ODSStore.getAll();
                    this.Tags = r.linhas.map(x=>{
                        x.ods = ODSStore.ODS.find(z=>z.id==x.ods_id);
                        return x;
                    });
                }else{
                    this.Tags = r.linhas;
                }
            } catch (error) {
                this.Tags = { error };
            }
        },
        async getById(id) {
            this.tempTags = { loading: true };
            try {
                if(!this.Tags.length){
                    await this.getAll();
                }
                this.tempTags = this.Tags.find((u)=>u.id == id);
                if(!this.tempTags) throw 'Tags não encontrada';
            } catch (error) {
                this.tempTags = { error };
            }
        },
        async insert(params) {
            if(await requestS.post(`${baseUrl}/tag`, params)) return true;
            return false;
        },
        async update(id, params) {
            console.log(params.ods_id);
            var m = {
                icone: params.icone,
                pdm_id: params.pdm_id,
                ods_id: params.ods_id?params.ods_id:null,
                descricao: params.descricao,
            };
            if(await requestS.patch(`${baseUrl}/tag/${id}`, m)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/tag/${id}`)) return true;
            return false;
        },
        async filterTags(f){
            this.tempTags = { loading: true };
            try {
                if(!this.Tags.length){
                    await this.getAll();
                }
                this.tempTags = f ? this.Tags.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.Tags;
            } catch (error) {
                this.tempTags = { error };
            }
        },
    }
});
