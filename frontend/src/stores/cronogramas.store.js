import { requestS } from '@/helpers';
import dateToField from '@/helpers/dateToField.js';
import { useEtapasStore } from '@/stores';
import { defineStore } from 'pinia';
import { toRaw } from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

// eslint-disable-next-line import/prefer-default-export
export const useCronogramasStore = defineStore({
  id: 'Cronogramas',
  state: () => ({
    Cronogramas: {},
    singleCronograma: {},
    singleCronogramaEtapas: {},
  }),
  actions: {
    clear() {
      this.Cronogramas = {};
      this.singleCronograma = {};
      this.singleCronogramaEtapas = {};
    },
    clearEdit() {
      this.singleCronograma = {};
    },
    async getAll(p_id, parent_field) {
      try {
        if (!this.Cronogramas[parent_field]) this.Cronogramas[parent_field] = [];
        if (!this.Cronogramas[parent_field][p_id]) {
          this.Cronogramas[parent_field][p_id] = { loading: true };
          const r = await requestS.get(`${baseUrl}/cronograma?${parent_field}=${p_id}`);
          this.Cronogramas[parent_field][p_id] = r.linhas.map((x) => {
            x.inicio_previsto = dateToField(x.inicio_previsto);
            x.termino_previsto = dateToField(x.termino_previsto);
            x.inicio_real = dateToField(x.inicio_real);
            x.termino_real = dateToField(x.termino_real);
            return x;
          });
        }
        return true;
      } catch (error) {
        this.Cronogramas[parent_field][p_id] = { error };
      }
    },
    async getActiveByParent(p_id, parent_field) {
      try {
        this.singleCronograma = { loading: true };
        this.singleCronogramaEtapas = { loading: true };

        this.singleCronograma = await this.getItemByParent(p_id, parent_field);
        this.getEtapasByCron(this.singleCronograma?.id);
        return true;
      } catch (error) {
        this.singleCronograma = { error };
      }
    },
    async getItemByParent(p_id, parent_field) {
      try {
        await this.getAll(p_id, parent_field);
        const r = this.Cronogramas[parent_field][p_id].length ? this.Cronogramas[parent_field][p_id][0] : {};
        return r;
      } catch (error) {
        return { error };
      }
    },
    async getById(p_id, parent_field, cronograma_id) {
      try {
        if (!cronograma_id) throw 'Cronograma inválido';
        this.singleCronograma = { loading: true };
        this.singleCronogramaEtapas = { loading: true };
        await this.getAll(p_id, parent_field);
        this.singleCronograma = this.Cronogramas[parent_field][p_id].length ? this.Cronogramas[parent_field][p_id].find((u) => u.id == cronograma_id) : {};
        this.getEtapasByCron(this.singleCronograma?.id);
        return true;
      } catch (error) {
        this.singleCronograma = { error };
      }
    },
    async insert(params) {
      const r = await requestS.post(`${baseUrl}/cronograma`, params);
      if (r.id) return r.id;
      return false;
    },
    async update(id, params) {
      if (await requestS.patch(`${baseUrl}/cronograma/${id}`, params)) return true;
      return false;
    },
    async delete(cronograma_id) {
      const r = await requestS.delete(`${baseUrl}/cronograma/${cronograma_id}`);
      if (r) return true;
      return false;
    },
    async getEtapasByCron(cronograma_id) {
      try {
        this.singleCronogramaEtapas = await this.getEtapasItemsByCron(cronograma_id);
      } catch (error) {
        this.singleCronogramaEtapas = { error };
      }
    },
    async getEtapasItemsByCron(cronograma_id) {
      try {
        if (!cronograma_id) throw 'Cronograma inválido';
        const EtapasStore = useEtapasStore();
        await EtapasStore.getAll(cronograma_id);
        return EtapasStore.Etapas[cronograma_id];
      } catch (error) {
        return { error };
      }
    },

    async excluirEtapa(idDaEtapa) {
      const r = await requestS.delete(`${baseUrl}/etapa/${idDaEtapa}`);
      if (r) {
        // remover recursivamente da tela todas as etapas com o id informado
        // para evitar recarregar tudo
        this.singleCronogramaEtapas = toRaw(this.singleCronogramaEtapas).filter(function f(x) {
          if (x.etapa_id === idDaEtapa) {
            return false;
          }

          if (x.etapa_filha) {
          // eslint-disable-next-line no-param-reassign
            x.etapa_filha = x.etapa_filha.filter(f);

            return !!x.etapa_filha.length;
          }
          if (x.etapa?.etapa_filha) {
          // eslint-disable-next-line no-param-reassign
            x.etapa.etapa_filha = x.etapa.etapa_filha.filter(f);

            return !!x.etapa.etapa_filha.length;
          }

          return true;
        });

        return true;
      }

      return false;
    },
  },
});
