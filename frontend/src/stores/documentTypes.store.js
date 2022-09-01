import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useDocumentTypesStore = defineStore({
    id: 'documentTypes',
    state: () => ({
        documentTypes: {},
        tempDocumentTypes: {},
    }),
    actions: {
        clear (){
            this.documentTypes = {};
            this.tempDocumentTypes = {};
        },
        async getAll() {
            this.documentTypes = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/tipo-documento`);    
                this.documentTypes = r.linhas;
            } catch (error) {
                this.documentTypes = { error };
            }
        },
        async getById(id) {
            this.tempDocumentTypes = { loading: true };
            try {
                if(!this.documentTypes.length){
                    await this.getAll();
                }
                this.tempDocumentTypes = this.documentTypes.find((u)=>u.id == id);
                if(!this.tempDocumentTypes) throw 'Tipo de documento não encontrado';
            } catch (error) {
                this.tempDocumentTypes = { error };
            }
        },
        async insert(params) {
            await requestS.post(`${baseUrl}/tipo-documento`, params);
            return true;
        },
        async update(id, params) {
            var m = {
                extensoes: params.extensoes,
                descricao: params.descricao,
                titulo: params.titulo,
                codigo: params.codigo
            };
            await requestS.patch(`${baseUrl}/tipo-documento/${id}`, m);
            return true;
        },
        async delete(id) {
            await requestS.delete(`${baseUrl}/tipo-documento/${id}`);
            return true;
        },
        async filterDocumentTypes(f){
            this.tempDocumentTypes = { loading: true };
            try {
                if(!this.documentTypes.length){
                    await this.getAll();
                }
                this.tempDocumentTypes = f ? this.documentTypes.filter((u)=>{
                    return f.textualSearch ? (u.descricao+u.titulo+u.codigo+u.extensoes).toLowerCase().includes(f.textualSearch.toLowerCase()) : 1;
                }) : this.documentTypes;
            } catch (error) {
                this.tempDocumentTypes = { error };
            }
        },
    }
});
