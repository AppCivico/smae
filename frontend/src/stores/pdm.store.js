import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const usePdMStore = defineStore({
    id: 'PdM',
    state: () => ({
        PdM: {},
        tempPdM: {},
    }),
    actions: {
        clear (){
            this.PdM = {};
            this.tempPdM = {};
        },
        async getAll() {
            this.PdM = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/pdm`);    
                this.PdM = r.linhas;
            } catch (error) {
                this.PdM = { error };
            }
        },
        async getById(id) {
            this.tempPdM = { loading: true };
            try {
                if(!this.PdM.length){
                    await this.getAll();
                }
                this.tempPdM = this.PdM.find((u)=>u.id == id);
                if(!this.tempPdM) throw 'PdM não encontrada';
            } catch (error) {
                this.tempPdM = { error };
            }
        },
        async insert(params) {
            await requestS.post(`${baseUrl}/pdm`, params);
            return true;
        },
        async update(id, params) {
            var m = {
                nome: params.nome,
                descricao: params.descricao,
                prefeito: params.prefeito,
                equipe_tecnica: params.equipe_tecnica,
                data_inicio: params.data_inicio, //"YYYY-MM-DD",
                data_fim: params.data_fim, //"YYYY-MM-DD",
                data_publicacao: params.data_publicacao, //"2022-09-01T02:23:12.803Z",
                periodo_do_ciclo_participativo_inicio: params.periodo_do_ciclo_participativo_inicio, //"2022-09-01T02:23:12.803Z",
                periodo_do_ciclo_participativo_fim: params.periodo_do_ciclo_participativo_fim, //"2022-09-01T02:23:12.803Z"
            };
            await requestS.patch(`${baseUrl}/pdm/${id}`, m);
            return true;
        },
        async delete(id) {
            await requestS.delete(`${baseUrl}/pdm/${id}`);
            return true;
        },
        async filterPdM(f){
            this.tempPdM = { loading: true };
            try {
                if(!this.PdM.length){
                    await this.getAll();
                }
                this.tempPdM = f ? this.PdM.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.PdM;
            } catch (error) {
                this.tempPdM = { error };
            }
        },
    }
});
