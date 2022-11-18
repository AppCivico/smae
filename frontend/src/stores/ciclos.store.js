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
        Cronogramas: {},
        SingleCronograma: {},
        SingleCronogramaEtapas: {},
        Etapas: {},
    }),
    actions: {
        dateToField(d){
            var dd=d?new Date(d):false;
            var dx = (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
            
            return dx??'';
        },
        fieldToDate(d){
            if(d){
                var x=d.split('/');
                return (x.length==3) ? new Date(Date.UTC(x[2],x[1]-1,x[0])).toISOString().substring(0, 10) : null;
            }
            return null;
        },
        clear (){
            this.MetasCiclos = {};
            this.SingleMeta = {};
            this.MetaVars = {};
            this.SingleAnalise = {};
            this.SingleMetaAnalise = {};
            this.SingleMetaAnaliseDocs = {};
            this.SingleRisco = {};
            this.SingleFechamento = {};
            
            this.Cronogramas = {};
            this.SingleCronograma = {};
            this.SingleCronogramaEtapas = {};
            this.Etapas = {};
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
      
        //Cronograma
        async getCronogramas(p_id,parent_field) {
            try {
                if(!this.Cronogramas[parent_field]) this.Cronogramas[parent_field] = [];
                if(!this.Cronogramas[parent_field][p_id]){
                    this.Cronogramas[parent_field][p_id] = { loading: true };
                    let r = await requestS.get(`${baseUrl}/mf/metas/cronograma?${parent_field}=${p_id}`);    
                    this.Cronogramas[parent_field][p_id] = r.linhas.map(x=>{
                        x.inicio_previsto = this.dateToField(x.inicio_previsto);
                        x.termino_previsto = this.dateToField(x.termino_previsto);
                        x.inicio_real = this.dateToField(x.inicio_real);
                        x.termino_real = this.dateToField(x.termino_real);
                        return x;
                    });
                }
                return true;
            } catch (error) {
                this.Cronogramas[parent_field][p_id] = { error };
            }
        },
        async getCronogramasActiveByParent(p_id,parent_field) {
            try {
                this.SingleCronograma = { loading: true };
                this.SingleCronogramaEtapas = { loading: true };
                
                this.SingleCronograma = await this.getCronogramasItemByParent(p_id,parent_field);
                this.getEtapasByCron(this.SingleCronograma?.id);
                return true;
            } catch (error) {
                this.SingleCronograma = { error };
            }
        },
        async getCronogramasItemByParent(p_id,parent_field) {
            try {
                await this.getCronogramas(p_id,parent_field);
                let r = this.Cronogramas[parent_field][p_id].length? this.Cronogramas[parent_field][p_id][0]:{};
                return r;
            } catch (error) {
                return {error};
            }
        },
        async getEtapasByCron(cronograma_id){
            try{
                this.SingleCronogramaEtapas = await this.getEtapasItemsByCron(cronograma_id);
            }catch(error){
                this.SingleCronogramaEtapas = { error };
            }
        },
        async getEtapasItemsByCron(cronograma_id){
            try{
                if(!cronograma_id) throw "Cronograma inválido";
                await this.getEtapas(cronograma_id);
                return this.Etapas[cronograma_id];
            }catch(error){
                return { error };
            }
        },
        async getEtapas(cronograma_id) {
            try {
                if(!this.Etapas[cronograma_id]){
                    this.Etapas[cronograma_id] = { loading: true };
                    let r = await requestS.get(`${baseUrl}/mf/metas/cronograma-etapa?cronograma_id=${cronograma_id}`);    
                    this.Etapas[cronograma_id] = r.linhas.length ? r.linhas.map(x=>{
                        if(x.cronograma_origem_etapa&&x.cronograma_origem_etapa.id==cronograma_id) delete x.cronograma_origem_etapa;
                        x.etapa.inicio_previsto = this.dateToField(x.etapa.inicio_previsto);
                        x.etapa.termino_previsto = this.dateToField(x.etapa.termino_previsto);
                        x.etapa.inicio_real = this.dateToField(x.etapa.inicio_real);
                        x.etapa.termino_real = this.dateToField(x.etapa.termino_real);
                        x.etapa.prazo = this.dateToField(x.etapa.prazo);
                        if(x.etapa.etapa_filha){
                            x.etapa.etapa_filha.map(xx=>{
                                xx.inicio_previsto = this.dateToField(xx.inicio_previsto);
                                xx.termino_previsto = this.dateToField(xx.termino_previsto);
                                xx.inicio_real = this.dateToField(xx.inicio_real);
                                xx.termino_real = this.dateToField(xx.termino_real);
                                xx.prazo = this.dateToField(xx.prazo);
                                if(xx.etapa_filha){
                                    xx.etapa_filha.map(xxx=>{
                                        xxx.inicio_previsto = this.dateToField(xxx.inicio_previsto);
                                        xxx.termino_previsto = this.dateToField(xxx.termino_previsto);
                                        xxx.inicio_real = this.dateToField(xxx.inicio_real);
                                        xxx.termino_real = this.dateToField(xxx.termino_real);
                                        xxx.prazo = this.dateToField(xxx.prazo);
                                        return xxx;
                                    })
                                }
                                return xx;
                            });
                        }
                        return x;
                    }).sort((a,b)=>{return a.ordem-b.ordem;}) : r.linhas;
                }
                return true;
            } catch (error) {
                this.Etapas[cronograma_id] = { error };
            }
        },
    },
});
