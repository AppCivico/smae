import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useCiclosStore = defineStore({
    id: 'Ciclos',
    state: () => ({
        MetasCiclos: {},
        SingleMeta: {},
        MetaVars: {}
    }),
    actions: {
        clear (){
            this.MetasCiclos = {};
            this.SingleMeta = {};
            this.MetaVars = {};
        },
        async getMetas() {
            this.MetasCiclos = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/mf/metas/`);    
                this.MetasCiclos = r.linhas;
            } catch (error) {
                this.MetasCiclos = { error };
            }
        },
        async getMetaById(id) {
            this.SingleMeta = { loading: true };
            try {
                if(!this.MetasCiclos.length){
                    await this.getMetas();
                }
                this.SingleMeta = this.MetasCiclos.find((u)=>u.id == id);
                if(!this.SingleMeta) throw 'Meta não encontrada';
            } catch (error) {
                this.SingleMeta = { error };
            }
        },
        async getMetaVars(id) {
            this.MetaVars = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/mf/metas/${id}/variaveis`);    
                this.MetaVars = r;
            } catch (error) {
                this.MetaVars = { error };
            }
        },
        
    },
});
