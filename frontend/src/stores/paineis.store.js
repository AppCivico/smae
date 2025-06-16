import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const usePaineisStore = defineStore('Paineis', {
  state: () => ({
    Paineis: {},
    tempPaineis: {},
    singlePainel: {},
    SingleSerie: {},
  }),
  actions: {
    clear() {
      this.Paineis = {};
      this.tempPaineis = {};
      this.singlePainel = {};
      this.SingleSerie = {};
    },
    async getAll() {
      this.Paineis = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/painel`);
        this.Paineis = r.linhas;
      } catch (error) {
        this.Paineis = { error };
      }
    },
    async getById(id) {
      this.singlePainel = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/painel/${id}`);
        if (r.id) {
          r.ativo = r.ativo ? '1' : false;
          r.mostrar_planejado_por_padrao = r.mostrar_planejado_por_padrao ? '1' : false;
          r.mostrar_acumulado_por_padrao = r.mostrar_acumulado_por_padrao ? '1' : false;
          r.mostrar_indicador_por_padrao = r.mostrar_indicador_por_padrao ? '1' : false;

          if (r.grupos) r.grupos = r.grupos.map((g) => g.grupo_painel.id);
          this.singlePainel = r;
        } else {
          throw 'Painel não encontrado';
        }
      } catch (error) {
        this.singlePainel = { error };
      }
    },
    async getByMeta(meta_id) {
      this.tempPaineis = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/painel/painel-da-meta`, { meta_id });
        this.tempPaineis = r.linhas;
      } catch (error) {
        this.tempPaineis = { error };
      }
    },
    async insert(params) {
      if (await this.requestS.post(`${baseUrl}/painel`, params)) return true;
      return false;
    },
    async update(id, params) {
      if (await this.requestS.patch(`${baseUrl}/painel/${id}`, params)) return true;
      return false;
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/painel/${id}`)) return true;
      return false;
    },
    async selectMetas(id, params) {
      if (await this.requestS.patch(`${baseUrl}/painel/${id}/conteudo`, params)) return true;
      return false;
    },
    async visualizacaoMeta(id, conteudo_id, params) {
      if (await this.requestS.patch(`${baseUrl}/painel/${id}/conteudo/${conteudo_id}/visualizacao`, params)) return true;
      return false;
    },
    async detalhesMeta(id, conteudo_id, params) {
      if (await this.requestS.patch(`${baseUrl}/painel/${id}/conteudo/${conteudo_id}/detalhes`, params)) return true;
      return false;
    },
    async getSerieMeta(id, conteudo_id) {
      this.SingleSerie = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/painel/${id}/conteudo/${conteudo_id}/serie`);
        this.SingleSerie = r;
      } catch (error) {
        this.SingleSerie = { error };
      }
    },
    async filterPaineis(f) {
      this.tempPaineis = { loading: true };
      try {
        if (!this.Paineis.length) {
          await this.getAll();
        }
        this.tempPaineis = f
          ? this.Paineis
            .filter((u) => (
              f.textualSearch
                ? (u.nome + u.periodicidade).toLowerCase().includes(f.textualSearch.toLowerCase())
                : 1))
          : this.Paineis;
      } catch (error) {
        this.tempPaineis = { error };
      }
    },
  },
  getters: {
    painéisPorId: ({ Paineis }) => (!Array.isArray(Paineis)
      ? {}
      : Paineis.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {})),
  },
});
