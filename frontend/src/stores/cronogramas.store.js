import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { useEtapasStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useCronogramasStore = defineStore({
    id: 'Cronogramas',
    state: () => ({
        Cronogramas: {},
        singleCronograma: {},
        singleCronogramaEtapas: {}
    }),
    actions: {
        clear (){
            this.Cronogramas = {};
            this.singleCronograma = {};
        },
        clearEdit (){
            this.singleCronograma = {};
        },
        dateToField(d){
            var dd=d?new Date(d):false;
            var dx = (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
            
            return dx??'';
        },
        fieldToDate(d){
            if(d){
                var x=d.split('/');
                return (x.length==3) ? new Date(x[2],x[1]-1,x[0]).toISOString().substring(0, 10) : null;
            }
            return null;
        },
        async getAll(p_id,parent_field) {
            try {
                if(!this.Cronogramas[parent_field]) this.Cronogramas[parent_field] = [];
                this.Cronogramas[parent_field][p_id] = { loading: true };
                let r = await requestS.get(`${baseUrl}/cronograma?${parent_field}=${p_id}`);    
                this.Cronogramas[parent_field][p_id] = r.linhas.map(x=>{
                    x.inicio_previsto = this.dateToField(x.inicio_previsto);
                    x.termino_previsto = this.dateToField(x.termino_previsto);
                    x.inicio_real = this.dateToField(x.inicio_real);
                    x.termino_real = this.dateToField(x.termino_real);
                    return x;
                });
            } catch (error) {
                this.Cronogramas[parent_field][p_id] = { error };
            }
        },
        async getActiveByParent(p_id,parent_field) {
            try {
                this.singleCronograma = { loading: true };
                this.singleCronogramaEtapas = { loading: true };
                await this.getAll(p_id,parent_field);
                this.singleCronograma = this.Cronogramas[parent_field][p_id].length? this.Cronogramas[parent_field][p_id][0]:{};
                this.getEtapasByCron(this.singleCronograma?.id);
                return true;
            } catch (error) {
                this.singleCronograma = { error };
            }
        },
        async getById(p_id,parent_field,cronograma_id) {
            try {
                if(!cronograma_id) throw "Cronograma inválido";
                this.singleCronograma = { loading: true };
                this.singleCronogramaEtapas = { loading: true };
                await this.getAll(p_id,parent_field);
                this.singleCronograma = this.Cronogramas[parent_field][p_id].length? this.Cronogramas[parent_field][p_id].find((u)=>u.id == cronograma_id):{};
                this.getEtapasByCron(this.singleCronograma?.id);
                return true;
            } catch (error) {
                this.singleCronograma = { error };
            }
        },
        async insert(params) {
            let r = await requestS.post(`${baseUrl}/cronograma`, params);
            if(r.id) return r.id;
            return false;
        },
        async update(id, params) {
            if(await requestS.patch(`${baseUrl}/cronograma/${id}`, params)) return true;
            return false;
        },
        async delete(cronograma_id) {
            if(await requestS.delete(`${baseUrl}/cronograma/${cronograma_id}`)){
                return true;
            }
            return false;
        },
        async getEtapasByCron(cronograma_id){
            try{
                if(!cronograma_id) throw "Cronograma inválido";
                const EtapasStore = useEtapasStore();
                await EtapasStore.getAll(cronograma_id);
                this.singleCronogramaEtapas = EtapasStore.Etapas[cronograma_id];
            }catch(error){
                this.singleCronogramaEtapas = { error };
            }
        },
        async getFakeData(){
            this.singleCronograma = {
              "id": 1,
              "iniciativa_id": 1,
              "meta_id": 1,
              "atividade_id": 1,
              "descricao": "Nome do Cronograma",
              "observacao": "string",
              "inicio_previsto": this.dateToField("2022-10-04T03:58:11.408Z"),
              "termino_previsto": this.dateToField("2022-10-04T03:58:11.408Z"),
              "inicio_real": this.dateToField("2022-10-04T03:58:11.408Z"),
              "termino_real": this.dateToField("2022-10-04T03:58:11.408Z"),
              "por_regiao": true,
              "tipo_regiao": "string"
            };

            this.singleCronogramaEtapas = [
                {
                  "id": 1,
                  "etapa_pai_id": 1,
                  "regiao_id": 1,
                  "descricao": "Nome da Etapa",
                  "nivel": "string",
                  "inicio_previsto": this.dateToField("2022-10-04T03:58:11.390Z"),
                  "termino_previsto": this.dateToField("2022-10-04T03:58:11.390Z"),
                  "inicio_real": this.dateToField("2022-10-04T03:58:11.390Z"),
                  "termino_real": this.dateToField("2022-10-04T03:58:11.390Z"),
                  "prazo": this.dateToField("2022-10-04T03:58:11.390Z"),
                },
                {
                  "id": 1,
                  "etapa_pai_id": 1,
                  "regiao_id": 1,
                  "descricao": "Nome da Etapa",
                  "nivel": "string",
                  "inicio_previsto": this.dateToField("2022-10-04T03:58:11.390Z"),
                  "termino_previsto": this.dateToField("2022-10-04T03:58:11.390Z"),
                  "inicio_real": this.dateToField("2022-10-04T03:58:11.390Z"),
                  "termino_real": this.dateToField("2022-10-04T03:58:11.390Z"),
                  "prazo": this.dateToField("2022-10-04T03:58:11.390Z"),
                }
            ];
        },
    }
});
