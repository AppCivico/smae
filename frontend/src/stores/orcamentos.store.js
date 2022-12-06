import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { useEtapasStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useOrcamentosStore = defineStore({
    id: 'Orcamentos',
    state: () => ({
        OrcamentoCusteio: {},
        OrcamentoPlanejado: {},
        OrcamentoRealizado: {},
    }),
    actions: {
        clear (){
            this.OrcamentoCusteio = {};
            this.OrcamentoPlanejado = {};
            this.OrcamentoRealizado = {};

        },
        async getById(id,ano) {
            this.getOrcamentoCusteioById(id,ano);
            this.getOrcamentoPlanejadoById(id,ano);
            this.getOrcamentoRealizadoById(id,ano);
        },
        async getOrcamentoCusteioById(id,ano) {
            try {
                this.OrcamentoCusteio[ano] = { loading: true };
                let r = await requestS.get(`${baseUrl}/meta-orcamento/?meta_id=${id}&ano_referencia=${ano}&apenas_ultima_revisao=true`);    
                this.OrcamentoCusteio[ano] = r.linhas ? r.linhas : r;
            } catch (error) {
                this.OrcamentoCusteio[ano] = { error };
            }
        },
        async getOrcamentoPlanejadoById(id,ano) {
            try {
                this.OrcamentoPlanejado[ano] = { loading: true };
                let r = await requestS.get(`${baseUrl}/orcamento-planejado/?meta_id=${id}&ano_referencia=${ano}`);    
                this.OrcamentoPlanejado[ano] = r.linhas ? r.linhas : r;
            } catch (error) {
                this.OrcamentoPlanejado[ano] = { error };
            }
        },
        async getOrcamentoRealizadoById(id,ano) {
            try {
                this.OrcamentoRealizado[ano] = { loading: true };
                //let r = await requestS.get(`${baseUrl}/orcamento-realizado/?meta_id=${id}&ano_referencia=${ano}`);    
                //this.OrcamentoRealizado[ano] = r.linhas ? r.linhas : r;
            } catch (error) {
                this.OrcamentoRealizado[ano] = { error };
            }
        },

        async updateOrcamentoCusteio(params) {
            if(await requestS.patch(`${baseUrl}/meta-orcamento`, params)) return true;
            return false;
        },
        async deleteOrcamentoCusteio(id) {
            if(await requestS.delete(`${baseUrl}/meta-orcamento/${id}`)) return true;
            return false;
        },
        
    }
});
