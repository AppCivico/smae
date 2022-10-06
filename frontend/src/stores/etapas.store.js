import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useEtapasStore = defineStore({
    id: 'Etapas',
    state: () => ({
        Etapas: {},
        singleEtapa: {},
        singleMonitoramento: {}
    }),
    actions: {
        clear (){
            this.Etapas = {};
            this.singleEtapa = {};
            this.singleMonitoramento = {};
        },
        clearEdit (){
            this.singleEtapa = {};
            this.singleMonitoramento = {};
        },
        dateToField(d){
            var dd=d?new Date(d):false;
            var dx = (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
            
            return dx??'';
        },
        fieldToDate(d){
            if(d){
                var x=d.split('/');
                return (x.length==3) ? new Date(x[2],x[1]-1,x[0]).toISOString().substring(0, 10) : null;
            }
            return null;
        },
        async getAll(cronograma_id) {
            try {
                this.Etapas[cronograma_id] = { loading: true };
                let r = await requestS.get(`${baseUrl}/cronograma-etapa?cronograma_id=${cronograma_id}`);    
                this.Etapas[cronograma_id] = r.linhas.length ? r.linhas.map(x=>{
                    if(x.cronograma_origem_etapa&&x.cronograma_origem_etapa.id==cronograma_id) delete x.cronograma_origem_etapa;
                    x.etapa.inicio_previsto = this.dateToField(x.etapa.inicio_previsto);
                    x.etapa.termino_previsto = this.dateToField(x.etapa.termino_previsto);
                    x.etapa.inicio_real = this.dateToField(x.etapa.inicio_real);
                    x.etapa.termino_real = this.dateToField(x.etapa.termino_real);
                    x.etapa.prazo = this.dateToField(x.etapa.prazo);
                    return x;
                }).sort((a,b)=>{return a.ordem-b.ordem;}) : r.linhas;
                return true;
            } catch (error) {
                this.Etapas[cronograma_id] = { error };
            }
        },
        async getById(cronograma_id,etapa_id) {
            try {
                if(!cronograma_id) throw "Cronograma inválido";
                if(!etapa_id) throw "Etapa inválida";
                this.singleEtapa = { loading: true };
                await this.getAll(cronograma_id);
                this.singleEtapa = this.Etapas[cronograma_id].length? this.Etapas[cronograma_id].find((u)=>u.etapa_id == etapa_id):{};
                return true;
            } catch (error) {
                this.singleEtapa = { error };
            }
        },
        async insert(cronograma_id,params) {
            params.inicio_previsto = this.fieldToDate(params.inicio_previsto);
            params.termino_previsto = this.fieldToDate(params.termino_previsto);
            params.inicio_real = this.fieldToDate(params.inicio_real);
            params.termino_real = this.fieldToDate(params.termino_real);
            let r = await requestS.post(`${baseUrl}/cronograma/${cronograma_id}/etapa`, params);
            if(r.id) return r.id;
            return false;
        },
        async update(id, params) {
            params.inicio_previsto = this.fieldToDate(params.inicio_previsto);
            params.termino_previsto = this.fieldToDate(params.termino_previsto);
            params.inicio_real = this.fieldToDate(params.inicio_real);
            params.termino_real = this.fieldToDate(params.termino_real);
            if(await requestS.patch(`${baseUrl}/etapa/${id}`, params)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/etapa/${id}`)){
                return true;
            }
            return false;
        },
        async monitorar(params) {
            if(await requestS.post(`${baseUrl}/cronograma-etapa`, params)) return true;
            return false;
        },
        async getMonitoramento(cronograma_id,etapa_id) {
            try {
                if(!cronograma_id) throw "Cronograma inválido";
                if(!etapa_id) throw "Etapa inválida";
                let r = await requestS.get(`${baseUrl}/cronograma-etapa?cronograma_id=${cronograma_id}&etapa_id=${etapa_id}`);    
                return r.linhas.length?r.linhas[0]:{};
            } catch (error) {
                return { error };
            }
        },
    }
});
