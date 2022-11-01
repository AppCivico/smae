import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const usePaineisStore = defineStore({
    id: 'Paineis',
    state: () => ({
        Paineis: {},
        tempPaineis: {},
        singlePainel: {}
    }),
    actions: {
        clear (){
            this.Paineis = {};
            this.tempPaineis = {};
            this.singlePainel = {};
        },
        async getAll() {
            this.Paineis = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/painel`);    
                this.Paineis = r.linhas;
            } catch (error) {
                this.Paineis = { error };
            }
        },
        async getById(id) {
            this.singlePainel = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/painel/${id}`);    
                if(r.id){
                    r.ativo = r.ativo ? "1":false;
                    r.mostrar_planejado_por_padrao = r.mostrar_planejado_por_padrao ? "1":false;
                    r.mostrar_acumulado_por_padrao = r.mostrar_acumulado_por_padrao ? "1":false;
                    r.mostrar_indicador_por_padrao = r.mostrar_indicador_por_padrao ? "1":false;
                    this.singlePainel = r;
                } else {
                    throw 'Painel não encontrado';
                }
            } catch (error) {
                this.singlePainel = { error };
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
        async selectMetas(id,params) {
            if(await requestS.patch(`${baseUrl}/painel/${id}/conteudo`, params)) return true;
            return false;
        },
        async visualizacaoMeta(id,conteudo_id,params) {
            if(await requestS.patch(`${baseUrl}/painel/${id}/conteudo/${conteudo_id}/visualizacao`, params)) return true;
            return false;
        },
        async detalhesMeta(id,conteudo_id,params) {
            if(await requestS.patch(`${baseUrl}/painel/${id}/conteudo/${conteudo_id}/detalhes`, params)) return true;
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
