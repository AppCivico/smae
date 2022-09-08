import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { usePdMStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAxesStore = defineStore({
    id: 'Axes',
    state: () => ({
        Axes: {},
        tempAxes: {},
    }),
    actions: {
        clear (){
            this.Axes = {};
            this.tempAxes = {};
        },
        async getAll() {
            this.Axes = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/macrotema`);    
                if(r.linhas.length){
                    const PdMStore = usePdMStore();
                    await PdMStore.getAll();
                    this.Axes = r.linhas.map(x=>{
                        x.pdm = PdMStore.PdM.find(z=>z.id==x.pdm_id);
                        return x;
                    });
                }else{
                    this.Axes = r.linhas;
                }
            } catch (error) {
                this.Axes = { error };
            }
        },
        async getAllSimple() {
            this.Axes = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/macrotema`);    
                this.Axes = r.linhas;
            } catch (error) {
                this.Axes = { error };
            }
        },
        async getById(id) {
            this.tempAxes = { loading: true };
            try {
                if(!this.Axes.length){
                    await this.getAll();
                }
                this.tempAxes = this.Axes.find((u)=>u.id == id);
                if(!this.tempAxes) throw 'Axes não encontrada';
            } catch (error) {
                this.tempAxes = { error };
            }
        },
        async insert(params) {
            var m = {
                pdm_id: Number(params.pdm_id),
                descricao: params.descricao
            };
            if(await requestS.post(`${baseUrl}/macrotema`, m)) return true;
            return false;
        },
        async update(id, params) {
            var m = {
                pdm_id: Number(params.pdm_id),
                descricao: params.descricao
            };
            if(await requestS.patch(`${baseUrl}/macrotema/${id}`, m)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/macrotema/${id}`)) return true;
            return false;
        },
        async filterAxes(f){
            this.tempAxes = { loading: true };
            try {
                if(!this.Axes.length){
                    await this.getAll();
                }
                this.tempAxes = f ? this.Axes.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.numero).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.Axes;
            } catch (error) {
                this.tempAxes = { error };
            }
        },
    }
});
