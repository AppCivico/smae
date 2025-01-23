import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta, segmentoOriginal) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return segmentoOriginal;
    case 'planoSetorial':
    case 'programaDeMetas':
      return `plano-setorial-${segmentoOriginal}`;
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

export const useEtapasStore = defineStore({
  id: 'Etapas',
  state: () => ({
    Etapas: {},
    singleEtapa: {},
    singleFase: {},
    singleMonitoramento: {},
  }),
  actions: {
    clear() {
      this.Etapas = {};
      this.singleEtapa = {};
      this.singleMonitoramento = {};
    },
    clearEdit() {
      this.singleEtapa = {};
      this.singleMonitoramento = {};
    },
    dateToField(d) {
      const dd = d
        ? new Date(d)
        : false;
      const dx = (dd)
        ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' })
        : '';

      return dx ?? '';
    },
    fieldToDate(d) {
      if (d) {
        const x = d.split('/');
        return (x.length === 3)
          ? new Date(Date.UTC(x[2], x[1] - 1, x[0])).toISOString().substring(0, 10)
          : null;
      }
      return null;
    },
    async getAll(cronograma_id) {
      try {
        if (!this.Etapas[cronograma_id]) {
          this.Etapas[cronograma_id] = { loading: true };
          const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta, 'cronograma-etapa')}?cronograma_id=${cronograma_id}`);
          this.Etapas[cronograma_id] = r.linhas.length
            ? r.linhas.map((x) => {
              if (x.cronograma_origem_etapa && x.cronograma_origem_etapa.id == cronograma_id) {
                delete x.cronograma_origem_etapa;
              }
              x.etapa.inicio_previsto = this.dateToField(x.etapa.inicio_previsto);
              x.etapa.termino_previsto = this.dateToField(x.etapa.termino_previsto);
              x.etapa.inicio_real = this.dateToField(x.etapa.inicio_real);
              x.etapa.termino_real = this.dateToField(x.etapa.termino_real);
              x.etapa.prazo = this.dateToField(x.etapa.prazo);
              if (x.etapa.etapa_filha) {
                x.etapa.etapa_filha.map((xx) => {
                  xx.inicio_previsto = this.dateToField(xx.inicio_previsto);
                  xx.termino_previsto = this.dateToField(xx.termino_previsto);
                  xx.inicio_real = this.dateToField(xx.inicio_real);
                  xx.termino_real = this.dateToField(xx.termino_real);
                  xx.prazo = this.dateToField(xx.prazo);
                  if (xx.etapa_filha) {
                    xx.etapa_filha.map((xxx) => {
                      xxx.inicio_previsto = this.dateToField(xxx.inicio_previsto);
                      xxx.termino_previsto = this.dateToField(xxx.termino_previsto);
                      xxx.inicio_real = this.dateToField(xxx.inicio_real);
                      xxx.termino_real = this.dateToField(xxx.termino_real);
                      xxx.prazo = this.dateToField(xxx.prazo);
                      return xxx;
                    });
                  }
                  return xx;
                });
              }
              return x;
            }).sort((a, b) => a.ordem - b.ordem)
            : r.linhas;
        }
        return true;
      } catch (error) {
        this.Etapas[cronograma_id] = { error };
      }
    },
    async getById(cronograma_id, etapa_id) {
      try {
        if (!cronograma_id) throw 'Cronograma inválido';
        if (!etapa_id) throw 'Etapa inválida';
        this.singleEtapa = { loading: true };
        if (!this.Etapas[cronograma_id]) await this.getAll(cronograma_id);
        this.singleEtapa = this.Etapas[cronograma_id].length
          ? this.Etapas[cronograma_id].find((u) => u.etapa_id == etapa_id)
          : {};
        return true;
      } catch (error) {
        this.singleEtapa = { error };
      }
    },
    async insert(cronograma_id, params) {
      params.inicio_previsto = this.fieldToDate(params.inicio_previsto);
      params.termino_previsto = this.fieldToDate(params.termino_previsto);
      params.inicio_real = this.fieldToDate(params.inicio_real);
      params.termino_real = this.fieldToDate(params.termino_real);
      const r = await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta, 'cronograma')}/${cronograma_id}/etapa`, params);
      if (r.id) return r.id;
      return false;
    },
    async update(id, params) {
      params.inicio_previsto = this.fieldToDate(params.inicio_previsto);
      params.termino_previsto = this.fieldToDate(params.termino_previsto);
      params.inicio_real = this.fieldToDate(params.inicio_real);
      params.termino_real = this.fieldToDate(params.termino_real);
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta, 'etapa')}/${id}`, params)) return true;
      return false;
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(this.route.meta, 'etapa')}/${id}`)) {
        return true;
      }
      return false;
    },
    async monitorar(params) {
      if (await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta,'cronograma-etapa')}`, params)) return true;
      return false;
    },
    async getMonitoramento(cronograma_id, etapa_id) {
      try {
        if (!cronograma_id) throw 'Cronograma inválido';
        if (!etapa_id) throw 'Etapa inválida';
        this.singleMonitoramento = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta,'cronograma-etapa')}?cronograma_id=${cronograma_id}&etapa_id=${etapa_id}`);
        this.singleMonitoramento = r.linhas.length ? r.linhas[0] : {};
        return r.linhas.length ? r.linhas[0] : {};
      } catch (error) {
        this.singleMonitoramento = { error };
        return { error };
      }
    },
  },
});
