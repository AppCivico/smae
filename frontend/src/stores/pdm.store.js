import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { useMacrotemasStore, useTemasStore, useTagsStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const usePdMStore = defineStore({
    id: 'PdM',
    state: () => ({
        PdM: {},
        tempPdM: {},
        singlePdm: {},
    }),
    actions: {
        clear (){
            this.PdM = {};
            this.tempPdM = {};
            this.singlePdm = {};
        },
        clearEdit (){
            this.singlePdm = {};
        },
        dateToField(d){
            var dd=d?new Date(d):false;
            return (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short'}):'';
        },
        fieldToDate(d){
            if(d){
                var x=d.split('/');
                return (x.length==3) ? new Date(x[2],x[1]-1,x[0]).toISOString().substring(0, 10) : null;
            }
            return null;
        },
        async getAll() {
            this.PdM = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/pdm`);    
                if(r.linhas.length){
                    const macrotemasStore = useMacrotemasStore();
                    const TemasStore = useTemasStore();
                    const tagsStore = useTagsStore();

                    await Promise.all([
                        macrotemasStore.getAllSimple(),
                        TemasStore.getAllSimple(),
                        tagsStore.getAllSimple()
                    ]);

                    this.PdM = r.linhas.map(x=>{
                        x.data_inicio = this.dateToField(x.data_inicio);
                        x.data_fim = this.dateToField(x.data_fim);
                        x.data_publicacao = this.dateToField(x.data_publicacao);
                        x.periodo_do_ciclo_participativo_inicio = this.dateToField(x.periodo_do_ciclo_participativo_inicio);
                        x.periodo_do_ciclo_participativo_fim = this.dateToField(x.periodo_do_ciclo_participativo_fim);

                        x.macrotemas = macrotemasStore.Macrotemas.filter(z=>z.pdm_id==x.id) ?? [];
                        x.temas = TemasStore.Temas.filter(z=>z.pdm_id==x.id) ?? [];
                        x.tags = tagsStore.Tags.filter(z=>z.pdm_id==x.id) ?? [];

                        return x;
                    });
                }else{
                    this.PdM = r.linhas;
                }
            } catch (error) {
                this.PdM = { error };
            }
        },
        async getById(id) {
            this.singlePdm = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/pdm/${id}`);    
                if(r.nome){
                    this.singlePdm = (x=>{
                        x.data_inicio = this.dateToField(x.data_inicio);
                        x.data_fim = this.dateToField(x.data_fim);
                        x.data_publicacao = this.dateToField(x.data_publicacao);
                        x.periodo_do_ciclo_participativo_inicio = this.dateToField(x.periodo_do_ciclo_participativo_inicio);
                        x.periodo_do_ciclo_participativo_fim = this.dateToField(x.periodo_do_ciclo_participativo_fim);

                        x.desativado = !x.ativo?'1':false;
                        return x;
                    })(r);
                }else{
                    this.singlePdm = r;
                }
            } catch (error) {
                this.singlePdm = { error };
            }
        },
        async insert(params) {
            var m = {
                nome: params.nome,
                descricao: params.descricao,
                prefeito: params.prefeito,
                equipe_tecnica: params.equipe_tecnica,
                data_inicio: this.fieldToDate(params.data_inicio),
                data_fim: this.fieldToDate(params.data_fim),
                data_publicacao: this.fieldToDate(params.data_publicacao),
                periodo_do_ciclo_participativo_inicio: this.fieldToDate(params.periodo_do_ciclo_participativo_inicio),
                periodo_do_ciclo_participativo_fim: this.fieldToDate(params.periodo_do_ciclo_participativo_fim),
            };
            if(await requestS.post(`${baseUrl}/pdm`, m)) return true;
            return false;
        },
        async update(id, params) {
            var m = {
                ativo: params.desativado?false:true,
                desativado: Boolean(params.desativado),
                nome: params.nome,
                descricao: params.descricao,
                prefeito: params.prefeito,
                equipe_tecnica: params.equipe_tecnica,
                data_inicio: this.fieldToDate(params.data_inicio),
                data_fim: this.fieldToDate(params.data_fim),
                data_publicacao: this.fieldToDate(params.data_publicacao),
                periodo_do_ciclo_participativo_inicio: this.fieldToDate(params.periodo_do_ciclo_participativo_inicio),
                periodo_do_ciclo_participativo_fim: this.fieldToDate(params.periodo_do_ciclo_participativo_fim),
            };
            if(await requestS.patch(`${baseUrl}/pdm/${id}`, m)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/pdm/${id}`)) return true;
            return false;
        },
        async filterPdM(f){
            if(!this.tempPdM.length)this.tempPdM = { loading: true };
            try {
                await this.getAll();
                this.tempPdM = f ? this.PdM.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.PdM;
            } catch (error) {
                this.tempPdM = { error };
            }
        },
    }
});
