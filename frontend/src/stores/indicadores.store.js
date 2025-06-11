import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return 'indicador';
    case 'planoSetorial':
    case 'programaDeMetas':
      return 'plano-setorial-indicador';
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

export const useIndicadoresStore = defineStore('Indicadores', {
  state: () => ({
    Indicadores: {},
    tempIndicadores: {},
    singleIndicadores: {},
    ValoresInd: {},
  }),
  actions: {
    clear() {
      this.Indicadores = {};
      this.tempIndicadores = {};
      this.singleIndicadores = {};
      this.ValoresInd = {};
    },
    dateToField(d) {
      const dd = d ? new Date(d) : false;
      const dx = (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }) : '';

      return dx ? dx.slice(3, 10) : '';
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
    async getAll(m, parent_field) {
      try {
        if (this.Indicadores.loading) return;
        this.Indicadores = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}?${parent_field}=${m}`);
        if (r.linhas.length) {
          this.Indicadores = r.linhas.map((x) => {
            x.inicio_medicao = this.dateToField(x.inicio_medicao);
            x.fim_medicao = this.dateToField(x.fim_medicao);
            x.agregador_id = x.agregador ? x.agregador.id : null;
            return x;
          });
        } else {
          this.Indicadores = r.linhas;
        }
      } catch (error) {
        this.Indicadores = { error };
      }
    },
    async getById(id) {
      try {
        this.singleIndicadores = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}?id=${id}`);
        if (r.linhas.length) {
          const x = r.linhas[0];

          if (x.acumulado_valor_base !== null) {
            x.acumulado_valor_base = Number.parseFloat(x.acumulado_valor_base, 10);
          }
          x.agregador_id = x.agregador ? x.agregador.id : null;

          this.singleIndicadores = x;
        } else {
          // mantendo comportamento legado
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw 'Indicador não encontrado';
        }
      } catch (error) {
        this.singleIndicadores = { error };
      }
    },
    async insert(params) {
      if (await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta)}`, params)) return true;
      return false;
    },
    async update(id, params) {
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`, params)) return true;
      return false;
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`)) return true;
      return false;
    },
    async filterIndicadores(p_id, parent_field, f) {
      try {
        this.tempIndicadores = { loading: true };
        // mantendo comportamento legado
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        if (!p_id || !parent_field) throw 'Indicador incorreto';
        await this.getAll(p_id, parent_field);
        this.tempIndicadores = f
          ? this.Indicadores
            .filter((u) => (f.textualSearch
              ? (u.descricao + u.titulo + u.numero).toLowerCase()
                .includes(f.textualSearch.toLowerCase())
              : 1
            ))
          : this.Indicadores;
      } catch (error) {
        this.tempIndicadores = { error };
      }
    },
    async getValores(id) {
      try {
        if (!id) throw new Error('Inidicador inválida');

        this.ValoresInd[id] = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}/serie`);

        this.ValoresInd[id] = r;
      } catch (error) {
        this.ValoresInd[id] = { error };
      }
    },
  },
});
