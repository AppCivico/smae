import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useIndicadoresStore = defineStore({
    id: 'Indicadores',
    state: () => ({
        Indicadores: {},
        tempIndicadores: {},
        singleIndicadores: {},
    }),
    actions: {
        clear (){
            this.Indicadores = {};
            this.tempIndicadores = {};
            this.singleIndicadores = {};
        },
        dateToField(d){
            var dd=d?new Date(d):false;
            var dx = (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
            
            return dx?dx.slice(3,10):'';
        },
        fieldToDate(d){
            if(d){
                var x=d.split('/');
                return (x.length==3) ? new Date(Date.UTC(x[2],x[1]-1,x[0])).toISOString().substring(0, 10) : null;
            }
            return null;
        },
        async getAll(m,parent_field) {
            try {
                if(this.Indicadores.loading) return;
                this.Indicadores = { loading: true };
                let r = await requestS.get(`${baseUrl}/indicador?${parent_field}=${m}`);    
                if(r.linhas.length){
                    this.Indicadores = r.linhas.map(x=>{
                        x.inicio_medicao = this.dateToField(x.inicio_medicao);
                        x.fim_medicao = this.dateToField(x.fim_medicao);
                        x.agregador_id = x.agregador?x.agregador.id:null;
                        return x;
                    });
                }else{
                    this.Indicadores = r.linhas;
                }
            } catch (error) {
                this.Indicadores = { error };
            }
        },
        async getById(m,parent_field,id) {
            try {
                this.singleIndicadores = { loading: true };
                await this.getAll(m,parent_field);
                this.singleIndicadores = this.Indicadores.length? this.Indicadores.find((u)=>u.id == id):{};
                if(!this.singleIndicadores) throw 'Indicadores não encontrada';
            } catch (error) {
                this.singleIndicadores = { error };
            }
        },
        async insert(params) {
            if(await requestS.post(`${baseUrl}/indicador`, params)) return true;
            return false;
        },
        async update(id, params) {
            if(await requestS.patch(`${baseUrl}/indicador/${id}`, params)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/indicador/${id}`)) return true;
            return false;
        },
        async filterIndicadores(p_id,parent_field,f){
            try {
                this.tempIndicadores = { loading: true };
                if(!p_id||!parent_field) throw 'Indicador incorreto';
                await this.getAll(p_id,parent_field);
                this.tempIndicadores = f ? this.Indicadores.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.Indicadores;
            } catch (error) {
                this.tempIndicadores = { error };
            }
        },
    }
});
