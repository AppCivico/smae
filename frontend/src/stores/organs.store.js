import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useOrgansStore = defineStore({
    id: 'organs',
    state: () => ({
        organs: {},
        tempOrgans: {},
        organTypes: {},
        tempOrganTypes: {}
    }),
    actions: {
        clear (){
            this.organs = {};
            this.tempOrgans = {};
            this.organTypes = {};
            this.tempOrganTypes = {};
        },
        async getAll() {
            this.organs = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/orgao`);    
                this.organs = r.linhas;
            } catch (error) {
                this.organs = { error };
            }
        },
        async getById(id) {
            this.tempOrgans = { loading: true };
            try {
                if(!this.organs.length){
                    await this.getAll();
                }
                this.tempOrgans = this.organs.find((u)=>u.id == id);
                this.tempOrgans.tipo_orgao_id = this.tempOrgans.tipo_orgao.id;
                if(!this.tempOrgans) throw 'Orgão não encontrado';
            } catch (error) {
                this.tempOrgans = { error };
            }
        },
        async insert(params) {
            await requestS.post(`${baseUrl}/orgao`, params);
            return true;
        },
        async update(id, params) {
            var m = {
                sigla: params.sigla,
                descricao: params.descricao,
                tipo_orgao_id: params.tipo_orgao_id
            };
            await requestS.patch(`${baseUrl}/orgao/${id}`, m);
            return true;
        },
        async delete(id) {
            await requestS.delete(`${baseUrl}/orgao/${id}`);
            return true;
        },
        async filterOrgans(f){
            this.tempOrgans = { loading: true };
            try {
                if(!this.organs.length){
                    await this.getAll();
                }
                this.tempOrgans = f ? this.organs.filter((u)=>{
                    return f.textualSearch ? u.descricao.toLowerCase().includes(f.textualSearch.toLowerCase()) || u.tipo_orgao.descricao.toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.organs;
            } catch (error) {
                this.tempOrgans = { error };
            }
        },


        async getAllTypes() {
            this.organTypes = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/tipo-orgao`);    
                this.organTypes = r.linhas;
            } catch (error) {
                this.organTypes = { error };
            }
        },
        async getByIdTypes(id) {
            this.tempOrganTypes = { loading: true };
            try {
                if(!this.organTypes.length){
                    await this.getAllTypes();
                }
                this.tempOrganTypes = this.organTypes.find((u)=>u.id == id);
                if(!this.tempOrganTypes) throw 'Orgão não encontrado';
            } catch (error) {
                this.tempOrganTypes = { error };
            }
        },
        async insertType(params) {
            await requestS.post(`${baseUrl}/tipo-orgao`, params);
            return true;
        },
        async updateType(id, params) {
            var m = {
                descricao: params.descricao
            };
            await requestS.patch(`${baseUrl}/tipo-orgao/${id}`, m);
            return true;
        },
        async deleteType(id) {
            await requestS.delete(`${baseUrl}/tipo-orgao/${id}`);
            return true;
        },
        async filterOrganTypes(f){
            this.tempOrganTypes = { loading: true };
            try {
                if(!this.organTypes.length){
                    await this.getAllTypes();
                }
                this.tempOrganTypes = f ? this.organTypes.filter((u)=>{
                    return f.textualSearch ? u.descricao.toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.organTypes;
            } catch (error) {
                this.tempOrganTypes = { error };
            }
        },
    }
});
