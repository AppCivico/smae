import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useDocumentTypesStore = () => {
  console.warn('Obsoleto. Prefira `useTiposDeDocumentosStore()`.');

  return defineStore('documentTypes', {

    state: () => ({
      documentTypes: {},
      tempDocumentTypes: {},
    }),
    actions: {
      clear() {
        this.documentTypes = {};
        this.tempDocumentTypes = {};
      },
      async getAll() {
        this.documentTypes = { loading: true };
        try {
          const r = await this.requestS.get(`${baseUrl}/tipo-documento`);
          this.documentTypes = r.linhas;
        } catch (error) {
          this.documentTypes = { error };
        }
      },
      async getById(id) {
        this.tempDocumentTypes = { loading: true };
        try {
          if (!this.documentTypes.length) {
            await this.getAll();
          }
          this.tempDocumentTypes = this.documentTypes.find((u) => u.id == id);
          if (!this.tempDocumentTypes) throw new Error('Tipo de documento não encontrado');
        } catch (error) {
          this.tempDocumentTypes = { error };
        }
      },
      async insert(params) {
        if (await this.requestS.post(`${baseUrl}/tipo-documento`, params)) return true;
        return false;
      },
      async update(id, params) {
        const m = {
          extensoes: params.extensoes,
          descricao: params.descricao,
          titulo: params.titulo,
          codigo: params.codigo,
        };
        if (await this.requestS.patch(`${baseUrl}/tipo-documento/${id}`, m)) return true;
        return false;
      },
      async delete(id) {
        if (await this.requestS.delete(`${baseUrl}/tipo-documento/${id}`)) return true;
        return false;
      },
      async filterDocumentTypes(f) {
        this.tempDocumentTypes = { loading: true };
        try {
          if (!this.documentTypes.length) {
            await this.getAll();
          }
          this.tempDocumentTypes = f
            ? this.documentTypes.filter((u) => (f.textualSearch
              ? (u.descricao + u.titulo + u.codigo + u.extensoes)
                .toLowerCase()
                .includes(f.textualSearch.toLowerCase())
              : 1))
            : this.documentTypes;
        } catch (error) {
          this.tempDocumentTypes = { error };
        }
      },
    },
  })();
};
