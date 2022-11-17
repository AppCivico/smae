import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useCiclosStore = defineStore({
    id: 'Ciclos',
    state: () => ({
        MetasCiclos: {},
        SingleMeta: {},
        MetaVars: {},
        SingleAnalise: {},
        SingleMetaAnalise: {},
        SingleMetaAnaliseDocs: {},
        SingleRisco: {},
        SingleFechamento: {},
    }),
    actions: {
        clear (){
            this.MetasCiclos = {};
            this.SingleMeta = {};
            this.MetaVars = {};
            this.SingleAnalise = {};
            this.SingleMetaAnalise = {};
            this.SingleMetaAnaliseDocs = {};
            this.SingleRisco = {};
            this.SingleFechamento = {};
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
        async getAnalise(id,periodo){
            this.SingleAnalise = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/mf/metas/variaveis/analise-qualitativa?data_valor=${periodo}&variavel_id=${id}&apenas_ultima_revisao=true`);
                this.SingleAnalise = r;
            } catch (error) {
                this.SingleAnalise = { error };
            }
        },
        async updateAnalise(params) {
            if(await requestS.patch(`${baseUrl}/mf/metas/variaveis/analise-qualitativa`, params)) return true;
            return false;
        },
        async updateFase(id,params) {
            if(await requestS.patch(`${baseUrl}/mf/metas/${id}/fase`, params)) return true;
            return false;
        },
        async deleteArquivo(id) {
            if(await requestS.delete(`${baseUrl}/mf/metas/variaveis/analise-qualitativa/documento/${id}`)) return true;
            return false;
        },
        async addArquivo(params) {
            if(await requestS.patch(`${baseUrl}/mf/metas/variaveis/analise-qualitativa/documento/`, params)) return true;
            return false;
        },
        async conferir(params) {
            if(await requestS.patch(`${baseUrl}/mf/metas/variaveis/conferida`, params)) return true;
            return false;
        },
        async complemento(params) {
            if(await requestS.patch(`${baseUrl}/mf/metas/variaveis/complemento`, params)) return true;
            return false;
        },

        //Meta
        async getMetaAnalise(ciclo_id,meta_id){
            this.SingleMetaAnalise = { loading: true };
            this.SingleMetaAnaliseDocs = { loading: true };

            try {
                let r = await requestS.get(`${baseUrl}/mf/metas/analise-qualitativa?ciclo_fisico_id=${ciclo_id}&meta_id=${meta_id}&apenas_ultima_revisao=true`);
                this.SingleMetaAnalise = r.analises[0]?r.analises[0]:{};
                this.SingleMetaAnaliseDocs = r.arquivos;
            } catch (error) {
                this.SingleMetaAnalise = { error };
                this.SingleMetaAnaliseDocs = {};
            }
        },
        async updateMetaAnalise(params) {
            if(await requestS.patch(`${baseUrl}/mf/metas/analise-qualitativa`, params)) return true;
            return false;
        },
        async deleteMetaArquivo(id) {
            if(await requestS.delete(`${baseUrl}/mf/metas/analise-qualitativa/documento/${id}`)) return true;
            return false;
        },
        async addMetaArquivo(params) {
            if(await requestS.patch(`${baseUrl}/mf/metas/analise-qualitativa/documento/`, params)) return true;
            return false;
        },

        //Risco
        async getMetaRisco(ciclo_id,meta_id){
            this.SingleRisco = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/mf/metas/risco?ciclo_fisico_id=${ciclo_id}&meta_id=${meta_id}&apenas_ultima_revisao=true`);
                this.SingleRisco = r;
                this.SingleRisco = r.riscos[0]?r.riscos[0]:{};
            } catch (error) {
                this.SingleRisco = { error };
            }
        },
        async updateMetaRisco(params) {
            if(await requestS.patch(`${baseUrl}/mf/metas/risco`, params)) return true;
            return false;
        },

        //Fechamento
        async getMetaFechamento(ciclo_id,meta_id){
            this.SingleFechamento = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/mf/metas/fechamento?ciclo_fisico_id=${ciclo_id}&meta_id=${meta_id}&apenas_ultima_revisao=true`);
                this.SingleFechamento = r.Fechamentos[0]?r.Fechamentos[0]:{};
            } catch (error) {
                this.SingleFechamento = { error };
            }
        },
        async updateMetaFechamento(params) {
            if(await requestS.patch(`${baseUrl}/mf/metas/fechamento`, params)) return true;
            return false;
        },
        
    },
});
