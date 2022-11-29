import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useVariaveisStore = defineStore({
    id: 'Variaveis',
    state: () => ({
        Variaveis: {},
        singleVariaveis: {},
        Valores: {}
    }),
    actions: {
        clear (){
            this.Variaveis = {};
            this.Valores = {};
            this.singleVariaveis = {};
        },
        clearEdit (){
            this.singleVariaveis = {};
        },
        dateToField(d){
            var dd=d?new Date(d):false;
            var dx = (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
            
            return dx?dx.slice(3,10):'';
        },
        async getAll(indicador_id) {
            try {
                if(!indicador_id) throw "Indicador inválido";
                if(!this.Variaveis[indicador_id]?.length)this.Variaveis[indicador_id] = { loading: true };
                let r = await requestS.get(`${baseUrl}/indicador-variavel?remover_desativados=true&indicador_id=${indicador_id}`);    
                this.Variaveis[indicador_id] = r.linhas.map(x=>{
                    
                    x.orgao_id = x.orgao?.id ?? null;
                    x.regiao_id = x.regiao?.id ?? null;
                    x.unidade_medida_id = x.unidade_medida?.id ?? null;
                    x.acumulativa = x.acumulativa?"1":false;
                    x.inicio_medicao = this.dateToField(x.inicio_medicao);
                    x.fim_medicao = this.dateToField(x.fim_medicao);
                    return x;
                });
            } catch (error) {
                this.Variaveis[indicador_id] = { error };
            }
        },
        async getById(indicador_id,var_id) {
            try {
                if(!indicador_id) throw "Indicador inválido";
                if(!var_id) throw "Variável inválida";
                this.singleVariaveis = { loading: true };
                if(!this.Variaveis[indicador_id]?.length){
                    await this.getAll(indicador_id);
                }
                this.singleVariaveis = this.Variaveis[indicador_id].length? this.Variaveis[indicador_id].find((u)=>u.id == var_id):{};
                return true;
            } catch (error) {
                this.singleVariaveis = { error };
            }
        },
        async insert(params) {
            let r = await requestS.post(`${baseUrl}/indicador-variavel`, params);
            if(r.id) return r.id;
            return false;
        },
        async update(id, params) {
            if(await requestS.patch(`${baseUrl}/indicador-variavel/${id}`, params)) return true;
            return false;
        },
        async getValores(id) {
            try {
                if(!id) throw "Variável inválida";
                this.Valores[id] = { loading: true };
                let r = await requestS.get(`${baseUrl}/indicador-variavel/${id}/serie`);    
                this.Valores[id] = r;
            } catch (error) {
                this.Valores[id] = { error };
            }
        },
        async updateValores(params){
            if(await requestS.patch(`${baseUrl}/indicador-variavel-serie`, params)) return true;
            return false;
        }
    }
});
