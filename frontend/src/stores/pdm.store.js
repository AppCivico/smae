import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { router } from '@/router';
import { useAlertStore, useMacrotemasStore, useSubtemasStore, useTemasStore, useTagsStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const usePdMStore = defineStore({
    id: 'PdM',
    state: () => ({
        PdM: {},
        tempPdM: {},
        singlePdm: {},
        activePdm: {},
        arquivos: {}
    }),
    actions: {
        clear (){
            this.PdM = {};
            this.tempPdM = {};
            this.singlePdm = {};
            this.activePdm = {};
            this.arquivos = {};
        },
        clearEdit (){
            this.singlePdm = {};
            this.activePdm = {};
            this.arquivos = {};
        },
        clearLoad (){
            this.PdM = {};
            this.singleArquivo={};
        },
        dateToField(d){
            var dd=d?new Date(d):false;
            return (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
        },
        fieldToDate(d){
            if(d){
                var x=d.split('/');
                return (x.length==3) ? new Date(Date.UTC(x[2],x[1]-1,x[0])).toISOString().substring(0, 10) : null;
            }
            return null;
        },
        async getAll() {
            try {
                if(this.PdM.loading) return;
                this.PdM = { loading: true };
                let r = await requestS.get(`${baseUrl}/pdm`);    
                if(r.linhas.length){
                    const macrotemasStore = useMacrotemasStore();
                    const subtemasStore = useSubtemasStore();
                    const TemasStore = useTemasStore();
                    const tagsStore = useTagsStore();

                    await Promise.all([
                        !macrotemasStore.Macrotemas.length && !macrotemasStore.Macrotemas.loading &&macrotemasStore.getAllSimple(),
                        !subtemasStore.Subtemas.length && !subtemasStore.Subtemas.loading &&subtemasStore.getAllSimple(),
                        !TemasStore.Temas.length && !TemasStore.Temas.loading &&TemasStore.getAllSimple(),
                        !tagsStore.Tags.length && !tagsStore.Tags.loading &&tagsStore.getAllSimple()
                    ]);

                    this.PdM = r.linhas.map(x=>{
                        x.data_inicio = this.dateToField(x.data_inicio);
                        x.data_fim = this.dateToField(x.data_fim);
                        x.data_publicacao = this.dateToField(x.data_publicacao);
                        x.periodo_do_ciclo_participativo_inicio = this.dateToField(x.periodo_do_ciclo_participativo_inicio);
                        x.periodo_do_ciclo_participativo_fim = this.dateToField(x.periodo_do_ciclo_participativo_fim);
                        x.macrotemas = macrotemasStore.Macrotemas?macrotemasStore.Macrotemas.filter(z=>z.pdm_id==x.id) : [];
                        x.subtemas = subtemasStore.Subtemas?subtemasStore.Subtemas.filter(z=>z.pdm_id==x.id) : [];
                        x.temas = TemasStore.Temas?TemasStore.Temas.filter(z=>z.pdm_id==x.id) : [];
                        x.tags = tagsStore.Tags?tagsStore.Tags.filter(z=>z.pdm_id==x.id) : [];

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
                        x.ativo = x.ativo?'1':false;

                        x.possui_macro_tema = x.possui_macro_tema?'1':false;
                        x.possui_tema = x.possui_tema?'1':false;
                        x.possui_sub_tema = x.possui_sub_tema?'1':false;
                        x.possui_contexto_meta = x.possui_contexto_meta?'1':false;
                        x.possui_complementacao_meta = x.possui_complementacao_meta?'1':false;
                        x.possui_iniciativa = x.possui_iniciativa?'1':false;
                        x.possui_atividade = x.possui_atividade?'1':false;

                        return x;
                    })(r);
                }else{
                    this.singlePdm = r;
                }
            } catch (error) {
                this.singlePdm = { error };
            }
        },
        async getActive() {
            this.activePdm = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/pdm?ativo=true`);    
                if(r.linhas.length){
                    this.activePdm = (x=>{
                        x.data_inicio = this.dateToField(x.data_inicio);
                        x.data_fim = this.dateToField(x.data_fim);
                        x.data_publicacao = this.dateToField(x.data_publicacao);
                        x.periodo_do_ciclo_participativo_inicio = this.dateToField(x.periodo_do_ciclo_participativo_inicio);
                        x.periodo_do_ciclo_participativo_fim = this.dateToField(x.periodo_do_ciclo_participativo_fim);
                        x.ativo = x.ativo?'1':false;

                        x.possui_macro_tema = x.possui_macro_tema?'1':false;
                        x.possui_tema = x.possui_tema?'1':false;
                        x.possui_sub_tema = x.possui_sub_tema?'1':false;
                        x.possui_contexto_meta = x.possui_contexto_meta?'1':false;
                        x.possui_complementacao_meta = x.possui_complementacao_meta?'1':false;
                        x.possui_iniciativa = x.possui_iniciativa?'1':false;
                        x.possui_atividade = x.possui_atividade?'1':false;

                        return x;
                    })(r.linhas[0]);
                    if(r.ciclo_fisico_ativo){
                        this.activePdm.ciclo_fisico_ativo = r.ciclo_fisico_ativo;
                    }
                    return this.activePdm;
                }else{
                    const alertStore = useAlertStore();
                    alertStore.error('Programa de Metas não encontrado');
                    router.go(-1);
                    return false;
                }
            } catch (error) {
                this.activePdm = { error };
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
                ativo: params.ativo?true:false,

                possui_macro_tema: params.possui_macro_tema?true:false,
                possui_tema: params.possui_tema?true:false,
                possui_sub_tema: params.possui_sub_tema?true:false,
                possui_contexto_meta: params.possui_contexto_meta?true:false,
                possui_complementacao_meta: params.possui_complementacao_meta?true:false,
                possui_iniciativa: params.possui_iniciativa?true:false,
                possui_atividade: params.possui_atividade?true:false,

                rotulo_macro_tema: params.rotulo_macro_tema,
                rotulo_tema: params.rotulo_tema,
                rotulo_sub_tema: params.rotulo_sub_tema,
                rotulo_contexto_meta: params.rotulo_contexto_meta,
                rotulo_complementacao_meta: params.rotulo_complementacao_meta,
                rotulo_iniciativa: params.rotulo_iniciativa,
                rotulo_atividade: params.rotulo_atividade,

                upload_logo: params.upload_logo,
            };
            if(await requestS.post(`${baseUrl}/pdm`, m)){
                this.activePdm = {};
                return true;
            }
            return false;
        },
        async update(id, params) {
            var m = {
                ativo: params.ativo?true:false,
                nome: params.nome,
                descricao: params.descricao,
                prefeito: params.prefeito,
                equipe_tecnica: params.equipe_tecnica,
                data_inicio: this.fieldToDate(params.data_inicio),
                data_fim: this.fieldToDate(params.data_fim),
                data_publicacao: this.fieldToDate(params.data_publicacao),
                periodo_do_ciclo_participativo_inicio: this.fieldToDate(params.periodo_do_ciclo_participativo_inicio),
                periodo_do_ciclo_participativo_fim: this.fieldToDate(params.periodo_do_ciclo_participativo_fim),

                possui_macro_tema: params.possui_macro_tema?true:false,
                possui_tema: params.possui_tema?true:false,
                possui_sub_tema: params.possui_sub_tema?true:false,
                possui_contexto_meta: params.possui_contexto_meta?true:false,
                possui_complementacao_meta: params.possui_complementacao_meta?true:false,
                possui_iniciativa: params.possui_iniciativa?true:false,
                possui_atividade: params.possui_atividade?true:false,

                rotulo_macro_tema: params.rotulo_macro_tema,
                rotulo_tema: params.rotulo_tema,
                rotulo_sub_tema: params.rotulo_sub_tema,
                rotulo_contexto_meta: params.rotulo_contexto_meta,
                rotulo_complementacao_meta: params.rotulo_complementacao_meta,
                rotulo_iniciativa: params.rotulo_iniciativa,
                rotulo_atividade: params.rotulo_atividade,
              
                upload_logo: params.upload_logo,
            };
            if(await requestS.patch(`${baseUrl}/pdm/${id}`, m)){
                this.activePdm = {};
                return true;
            }
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/pdm/${id}`)){
                this.activePdm = {};
                return true;
            }
            return false;
        },
        async filterPdM(f){
            if(!this.tempPdM.length)this.tempPdM = { loading: true };
            try {
                await this.getAll();
                this.tempPdM = f&&this.PdM.length ? this.PdM.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.PdM;
                if(this.tempPdM.length)this.tempPdM.sort((a,b)=>{if(!a.ativo&&!b.ativo){return a.descricao.localeCompare(b.descricao);} return b.ativo-a.ativo;}).forEach(u=>{
                    this.carregaArquivos(u.id);
                })
            } catch (error) {
                this.tempPdM = { error };
            }
        },
        async insertArquivo(pdm_id, params) {
            if(await requestS.post(`${baseUrl}/pdm/${pdm_id}/documento`, params)){
                return true;
            }
            return false;
        },
        async deleteArquivo(pdm_id,id) {
            if(await requestS.delete(`${baseUrl}/pdm/${pdm_id}/documento/${id}`)){
                this.arquivos[pdm_id] = {};
                this.carregaArquivos(pdm_id);
                return true;
            }
            return false;
        },
        async carregaArquivos(pdm_id) {
            if(!this.arquivos[pdm_id]?.length)this.arquivos[pdm_id] = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/pdm/${pdm_id}/documento`);    
                this.arquivos[pdm_id] = r.linhas;
            } catch (error) {
                this.arquivos[pdm_id] = { error };
            }
        },
    }
});
