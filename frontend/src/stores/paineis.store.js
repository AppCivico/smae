import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const usePaineisStore = defineStore({
    id: 'Paineis',
    state: () => ({
        Paineis: {},
        tempPaineis: {},
    }),
    actions: {
        clear (){
            this.Paineis = {};
            this.tempPaineis = {};
        },
        async getAll() {
            this.Paineis = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/painel`);    
                this.Paineis = r.linhas.length ? r.linhas.map(x=>{
                	x.ativo = x.ativo ? "1":false;
                	x.mostrar_planejado_por_padrao = x.mostrar_planejado_por_padrao ? "1":false;
                	x.mostrar_acumulado_por_padrao = x.mostrar_acumulado_por_padrao ? "1":false;
                	x.mostrar_indicador_por_padrao = x.mostrar_indicador_por_padrao ? "1":false;
                	return x;
				}) : r.linhas;
            } catch (error) {
                this.Paineis = { error };
            }
        },
        async getById(id) {
            this.tempPaineis = { loading: true };
            try {
                if(!this.Paineis.length){
                    await this.getAll();
                }
                this.tempPaineis = this.Paineis.find((u)=>u.id == id);
                if(!this.tempPaineis) throw 'Painel não encontrado';
            } catch (error) {
                this.tempPaineis = { error };
            }
        },
        async insert(params) {
            if(await requestS.post(`${baseUrl}/painel`, params)) return true;
            return false;
        },
        async update(id, params) {
            if(await requestS.patch(`${baseUrl}/painel/${id}`, params)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/painel/${id}`)) return true;
            return false;
        },
        async filterPaineis(f){
            this.tempPaineis = { loading: true };
            try {
                if(!this.Paineis.length){
                    await this.getAll();
                }
                this.tempPaineis = f ? this.Paineis.filter((u)=>{
                    return f.textualSearch ? (u.nome+u.periodicidade).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.Paineis;
            } catch (error) {
                this.tempPaineis = { error };
            }
        },
    }
});
