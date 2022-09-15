import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { usePdMStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useIndicadoresStore = defineStore({
    id: 'Indicadores',
    state: () => ({
        Indicadores: {},
        tempIndicadores: {},
    }),
    actions: {
        clear (){
            this.Indicadores = {};
            this.tempIndicadores = {};
        },
        async getAll() {
            try {
                if(this.Indicadores.loading) return;
                this.Indicadores = { loading: true };
                let r = await requestS.get(`${baseUrl}/indicador`);    
                this.Indicadores = r.linhas;
            } catch (error) {
                this.Indicadores = { error };
            }
        },
        async getById(id) {
            this.tempIndicadores = { loading: true };
            try {
                if(!this.Indicadores.length){
                    await this.getAllSimple();
                }
                this.tempIndicadores = this.Indicadores.length? this.Indicadores.find((u)=>u.id == id):{};
                if(!this.tempIndicadores) throw 'Indicadores não encontrada';
            } catch (error) {
                this.tempIndicadores = { error };
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
        async filterIndicadores(f){
            this.tempIndicadores = { loading: true };
            try {
                if(!this.Indicadores.length){
                    await this.getAll();
                }
                this.tempIndicadores = f ? this.Indicadores.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.Indicadores;
            } catch (error) {
                this.tempIndicadores = { error };
            }
        },
    }
});
