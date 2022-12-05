import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { useEtapasStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useOrcamentosStore = defineStore({
    id: 'Orcamentos',
    state: () => ({
        metaOrcamentos: {},
    }),
    actions: {
        clear (){
            this.metaOrcamentos = {};
        },
        async getById(id) {
            this.metaOrcamentos = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/meta-orcamento/?meta_id=${id}&apenas_ultima_revisao=true`);    
                this.metaOrcamentos = r.linhas ? r.linhas.sort((a,b)=>b.ano_referencia-a.ano_referencia) : r;
            } catch (error) {
                this.metaOrcamentos = { error };
            }
        },
        async update(params) {
            if(await requestS.patch(`${baseUrl}/meta-orcamento`, params)) return true;
            return false;
        },
    }
});
