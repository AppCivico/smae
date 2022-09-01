import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useStrategicObjectivesStore = defineStore({
    id: 'strategicObjectives',
    state: () => ({
        strategicObjectives: {},
        tempStrategicObjectives: {},
    }),
    actions: {
        clear (){
            this.strategicObjectives = {};
            this.tempStrategicObjectives = {};
        },
        async getAll() {
            this.strategicObjectives = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/objetivo-estrategico`);    
                this.strategicObjectives = r.linhas;
            } catch (error) {
                this.strategicObjectives = { error };
            }
        },
        async getById(id) {
            this.tempStrategicObjectives = { loading: true };
            try {
                if(!this.strategicObjectives.length){
                    await this.getAll();
                }
                this.tempStrategicObjectives = this.strategicObjectives.find((u)=>u.id == id);
                if(!this.tempStrategicObjectives) throw 'Tipo de documento não encontrado';
            } catch (error) {
                this.tempStrategicObjectives = { error };
            }
        },
        async insert(params) {
            if(await requestS.post(`${baseUrl}/objetivo-estrategico`, params)) return true;
            return false;
        },
        async update(id, params) {
            var m = {
                extensoes: params.extensoes,
                descricao: params.descricao,
                titulo: params.titulo,
                codigo: params.codigo
            };
            if(await requestS.patch(`${baseUrl}/objetivo-estrategico/${id}`, m)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/objetivo-estrategico/${id}`)) return true;
            return false;
        },
        async filterStrategicObjectives(f){
            this.tempStrategicObjectives = { loading: true };
            try {
                if(!this.strategicObjectives.length){
                    await this.getAll();
                }
                this.tempStrategicObjectives = f ? this.strategicObjectives.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.codigo+u.extensoes).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.strategicObjectives;
            } catch (error) {
                this.tempStrategicObjectives = { error };
            }
        },
    }
});
