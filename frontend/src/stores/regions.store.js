import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useRegionsStore = defineStore({
    id: 'regions',
    state: () => ({
        listregions: {},
        regions: {},
        tempRegions: {},
        singleTempRegions: {},
    }),
    actions: {
        clear (){
            this.regions = {};
            this.tempRegions = {};
            this.singleTempRegions = {};
        },
        clearEdit (){
            this.singleTempRegions = {};
        },
        async getAll() {
            this.regions = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/regiao`);    
                this.listregions = r.linhas;
                if(r.linhas.length){
                    var h = {};
                    var g = {};
                    r.linhas.forEach(z=>{
                        h[z.id]=z;
                        if(!z.children) z.children = {};
                        if(!z.parente_id){
                            if(!g[z.id]) g[z.id] = z;
                        }else{
                            if(!g[z.parente_id]){

                                if(!g[h[z.parente_id].parente_id]){ // Se for neto

                                    g[h[h[z.parente_id].parente_id].parente_id].children[h[z.parente_id].parente_id].children[z.parente_id].children[z.id] = z;
                                }else{
                                    g[h[z.parente_id].parente_id].children[z.parente_id].children[z.id] = z;
                                }
                            }else{
                                g[z.parente_id].children[z.id] = z;
                            }
                        }
                    });
                    Object.values(g).forEach(x=>{
                        x.children = Object.values(x.children);
                        x.children.forEach(xx=>{
                            xx.children = Object.values(xx.children);
                            xx.children.forEach(xxx=>{
                                xxx.children = Object.values(xxx.children);
                                xxx.children.forEach(xxxx=>{
                                    if(xxxx.children)xxxx.children = Object.values(xxxx.children);
                                });
                            });
                        });
                    });
                    this.regions = Object.values(g);
                }else{
                    this.regions = r.linhas;
                }
            } catch (error) {
                this.regions = { error };
            }
        },
        async getById(id) {
            this.singleTempRegions = { loading: true };
            try {
                if(!this.listregions.length){
                    await this.getAll();
                }
                this.singleTempRegions = this.listregions.find((u)=>u.id == id);
                if(!this.singleTempRegions) throw 'Item não encontrado';
            } catch (error) {
                this.singleTempRegions = { error };
            }
        },
        async insert(params) {
            var m = {
                nivel: Number(params.nivel),
                parente_id: params.parente_id?Number(params.parente_id):null,
                descricao: params.descricao,
                shapefile: params.shapefile,
            };
            if(await requestS.post(`${baseUrl}/regiao`, m)) return true;
            return false;
        },
        async update(id, params) {
            var m = {
                //nivel: Number(params.nivel),
                parente_id: params.parente_id?Number(params.parente_id):null,
                descricao: params.descricao,
                shapefile: params.shapefile,
            };
            if(await requestS.patch(`${baseUrl}/regiao/${id}`, m)) return true;
            return false;
        },
        async delete(id) {
            if(await requestS.delete(`${baseUrl}/regiao/${id}`)) return true;
            return false;
        },
        async filterRegions(f){
            if(!this.tempRegions.length)this.tempRegions = { loading: true };
            try {
                //if(!this.regions.length){
                    await this.getAll();
                //}

                if(f&&f.textualSearch){
                    var b = f.textualSearch.toLowerCase();
                    this.tempRegions =  this.regions.filter((u)=>{
                        if(u.descricao.toLowerCase().includes(b)) return 1;
                        if(u.children.length) for (var i = 0; i < u.children.length; i++) {
                            if(u.children[i].descricao.toLowerCase().includes(b)) return 1;
                            if(u.children[i].children.length) for (var j = 0; j < u.children[i].children.length; j++) {
                                if(u.children[i].children[j].descricao.toLowerCase().includes(b)) return 1;
                            }
                        }
                        return 0;
                    });
                }else{
                    this.tempRegions = this.regions;
                }
            } catch (error) {
                this.tempRegions = { error };
            }
        },
    }
});
