import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { usePdMStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useIndicadoresStore = defineStore({
    id: 'Indicadores',
    state: () => ({
        Indicadores: {},
        tempIndicadores: {},
        agregadores: {},
    }),
    actions: {
        clear (){
            this.Indicadores = {};
            this.tempIndicadores = {};
        },
        dateToField(d){
            var dd=d?new Date(d):false;
            var dx = (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short'}):'';
            
            return dx?dx.slice(3,10):'';
        },
        fieldToDate(d){
            if(d){
                var x=d.split('/');
                return (x.length==3) ? new Date(x[2],x[1]-1,x[0]).toISOString().substring(0, 10) : null;
            }
            return null;
        },
        async getAll(m) {
            try {
                if(this.Indicadores.loading) return;
                this.Indicadores = { loading: true };
                let r = await requestS.get(`${baseUrl}/indicador?meta_id=${m}`);    
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
        async getById(m,id) {
            this.tempIndicadores = { loading: true };
            try {
                if(!this.Indicadores.length){
                    await this.getAll(m);
                }
                this.tempIndicadores = this.Indicadores.length? this.Indicadores.find((u)=>u.id == id):{};
                if(!this.tempIndicadores) throw 'Indicadores não encontrada';
            } catch (error) {
                this.tempIndicadores = { error };
            }
        },
        async getAgregadores(id) {
            try {
                if(!this.agregadores.length){
                    let r = await requestS.get(`${baseUrl}/agregadores`);    
                    this.agregadores = r.linhas;
                }
            } catch (error) {
                this.agregadores = { error };
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
        async filterIndicadores(m,f){
            console.log(m,f);
            this.tempIndicadores = { loading: true };
            try {
                if(!m) throw 'Meta incorreta';
                await this.getAll(m);
                this.tempIndicadores = f ? this.Indicadores.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.Indicadores;
            } catch (error) {
                this.tempIndicadores = { error };
            }
        },
    }
});
