import retornarPosiçõesPorValor from '@/helpers/retornarPosicoesPorValor';
import { usePdMStore } from '@/stores/pdm.store';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useCiclosStore = defineStore('Ciclos', {
  state: () => ({
    Ciclos: {},
    SingleCiclo: {},
    MetasCiclos: {},
    SingleMeta: {},
    MetaVars: {},
    dadosExtrasDeVariaveis: [],
    dadosExtrasDeComposta: {},
    SingleAnalise: {},
    SingleMetaAnalise: {},
    SingleMetaAnaliseDocs: {},
    SingleRisco: {},
    SingleFechamento: {},
    Cronogramas: {},
    SingleCronograma: {},
    SingleCronogramaEtapas: {},
    SingleEtapa: {},
    Etapas: {},
    activePdm: null,

    valoresNovos: {
      valorRealizado: null,
      valorRealizadoAcumulado: null,
    },

    chamadasPendentes: {
      submeterACoordenadoriaDePlanejamento: false,
    },
  }),
  actions: {
    dateToField(d) {
      const dd = d ? new Date(d) : false;
      const dx = (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }) : '';

      return dx ?? '';
    },
    fieldToDate(d) {
      if (d) {
        const x = d.split('/');
        return (x.length == 3)
          ? new Date(Date.UTC(x[2], x[1] - 1, x[0])).toISOString().substring(0, 10)
          : null;
      }
      return null;
    },
    clear() {
      this.MetasCiclos = {};
      this.SingleMeta = {};
      this.MetaVars = {};
      this.SingleAnalise = {};
      this.SingleMetaAnalise = {};
      this.SingleMetaAnaliseDocs = {};
      this.SingleRisco = {};
      this.SingleFechamento = {};

      this.Cronogramas = {};
      this.SingleCronograma = {};
      this.SingleCronogramaEtapas = {};
      this.Etapas = {};
      this.SingleEtapa = {};

      this.Ciclos = {};
      this.SingleCiclo = {};
    },

    // Ciclos
    async getPdM() {
      const PdMStore = usePdMStore();
      if (!PdMStore.activePdm.id) {
        await PdMStore.getActive();
      }
      this.activePdm = PdMStore.activePdm;
      return this.activePdm;
    },
    async getCiclos() {
      try {
        this.Ciclos = { loading: true };
        if (!this.activePdm) await this.getPdM();
        const r = await this.requestS.get(`${baseUrl}/pdm-ciclo/v2?pdm_id=${this.activePdm.id}`);
        this.Ciclos = r.linhas.map((x) => {
          x.inicio_coleta = this.dateToField(x.inicio_coleta);
          x.inicio_qualificacao = this.dateToField(x.inicio_qualificacao);
          x.inicio_analise_risco = this.dateToField(x.inicio_analise_risco);
          x.inicio_fechamento = this.dateToField(x.inicio_fechamento);
          x.fechamento = this.dateToField(x.fechamento);
          return x;
        });
      } catch (error) {
        this.Ciclos = { error };
      }
    },
    async getCicloById(ciclo_id) {
      try {
        this.SingleCiclo = { loading: true };
        if (!this.Ciclos.length && !this.Ciclos.loading) {
          await this.getCiclos();
        }
        await new Promise(this.waitForLoad).then(() => {
          this.SingleCiclo = this.Ciclos.find((x) => x.id == ciclo_id);
        });
      } catch (error) {
        this.SingleCiclo = { error };
      }
    },
    waitForLoad(resolve, reject) {
      if (this.Ciclos.length) resolve(1);
      else setTimeout(this.waitForLoad.bind(this, resolve, reject), 300);
    },
    async updateCiclos(id, params) {
      if (await this.requestS.patch(`${baseUrl}/pdm-ciclo/${id}`, params)) return true;
      return false;
    },

    async preencherValoresVazios(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/auxiliar/auto-preencher/`, params)) {
        return true;
      }
      return false;
    },

    async submeterACoordenadoriaDePlanejamento(params) {
      this.chamadasPendentes.submeterACoordenadoriaDePlanejamento = true;

      if (await this.requestS.patch(`${baseUrl}/mf/auxiliar/enviar-para-cp/`, params)) {
        this.chamadasPendentes.submeterACoordenadoriaDePlanejamento = false;
        return true;
      }

      this.chamadasPendentes.submeterACoordenadoriaDePlanejamento = false;
      return false;
    },

    // Metas
    async getMetas() {
      this.MetasCiclos = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/mf/metas/`);
        this.MetasCiclos = r.linhas;
      } catch (error) {
        this.MetasCiclos = { error };
      }
    },
    async getMetaByIdCron(meta_id) {
      this.SingleMeta = { loading: true };
      try {
        this.SingleMeta = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/mf/metas/${meta_id}/iniciativas-e-atividades`);
        this.SingleMeta = r.meta ? r : {};
      } catch (error) {
        this.SingleMeta = { error };
      }
    },
    async getMetaById(meta_id) {
      this.SingleMeta = { loading: true };
      try {
        this.SingleMeta = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/meta/iniciativas-atividades?meta_ids=${meta_id}`);
        this.SingleMeta = r.linhas.length ? r.linhas[0] : {};
      } catch (error) {
        this.SingleMeta = { error };
      }
    },
    async getMetaVars(id) {
      this.MetaVars = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/mf/metas/${id}/variaveis`);
        this.MetaVars = r;
      } catch (error) {
        this.MetaVars = { error };
      }
    },

    async buscarDadosExtrasDeVariáveis(params) {
      this.dadosExtrasDeVariaveis = { loading: true };
      try {
        const r = await this.requestS.post(`${baseUrl}/mf/metas/variaveis/busca-analise-qualitativa`, params);
        if (Array.isArray(r.linhas)) {
          this.dadosExtrasDeVariaveis = r.linhas;
        }
      } catch (error) {
        this.dadosExtrasDeVariaveis = { error };
      }
    },

    async buscarDadosExtrasDeComposta(params) {
      this.dadosExtrasDeComposta = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/mf/metas/formula-composta/analise-qualitativa`, params);

        this.dadosExtrasDeComposta = r;
      } catch (error) {
        this.dadosExtrasDeComposta = { error };
      }
    },

    async salvarVariáveisCompostasEmLote(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/variaveis/analise-qualitativa-em-lote`, params)) return true;
      return false;
    },

    async salvarVariávelComposta(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/formula-composta/analise-qualitativa`, params)) return true;
      return false;
    },

    async getAnalise(id, periodo) {
      this.SingleAnalise = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/mf/metas/variaveis/analise-qualitativa?data_valor=${periodo}&variavel_id=${id}&apenas_ultima_revisao=true`);
        this.SingleAnalise = r;
      } catch (error) {
        this.SingleAnalise = { error };
      }
    },
    async updateAnalise(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/variaveis/analise-qualitativa`, params)) return true;
      return false;
    },
    async updateFase(id, params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/${id}/fase`, params)) return true;
      return false;
    },
    async deleteArquivo(id) {
      if (await this.requestS.delete(`${baseUrl}/mf/metas/variaveis/analise-qualitativa/documento/${id}`)) {
        this.SingleAnalise.arquivos = this.SingleAnalise.arquivos.filter((x) => x.id !== id);
        return true;
      }
      return false;
    },
    async addArquivo(params, dadosParaEnvio) {
      try {
        const { id = 0, download_token: downloadToken } = await this.requestS.patch(`${baseUrl}/mf/metas/variaveis/analise-qualitativa/documento/`, params);

        if (id) {
          const dadosDoArquivo = {
            id,
            arquivo: {
              nome_original: dadosParaEnvio.arquivo.name,
              descricao: dadosParaEnvio.descricao,
              download_token: downloadToken || dadosParaEnvio.upload_token,
            },
          };

          this.SingleAnalise.arquivos.push(dadosDoArquivo);
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    },

    // Não atualizar direto na lista porque ela já está muito bagunçada!
    async addArquivoComposta(params) {
      try {
        const { id = 0 } = await this.requestS.patch(`${baseUrl}/mf/metas/formula-composta/analise-qualitativa/documento/`, params);

        if (id) {
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    },

    async deleteArquivoComposta(id) {
      return !!await this.requestS.delete(`${baseUrl}/mf/metas/formula-composta/analise-qualitativa/documento/${id}`);
    },

    async conferir(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/variaveis/conferida`, params)) return true;
      return false;
    },
    async complemento(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/variaveis/complemento`, params)) return true;
      return false;
    },

    async solicitarComplementaçãoEmLote(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/variaveis/complemento-em-lote`, params)) return true;
      return false;
    },

    // Meta
    async getMetaAnalise(ciclo_id, meta_id) {
      this.SingleMetaAnalise = { loading: true };
      this.SingleMetaAnaliseDocs = { loading: true };

      try {
        const r = await this.requestS.get(`${baseUrl}/mf/metas/analise-qualitativa?ciclo_fisico_id=${ciclo_id}&meta_id=${meta_id}&apenas_ultima_revisao=true`);
        this.SingleMetaAnalise = r.analises[0] ? r.analises[0] : {};
        this.SingleMetaAnaliseDocs = r.arquivos;
      } catch (error) {
        this.SingleMetaAnalise = { error };
        this.SingleMetaAnaliseDocs = {};
      }
    },
    async updateMetaAnalise(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/analise-qualitativa`, params)) return true;
      return false;
    },
    async deleteMetaArquivo(id) {
      if (await this.requestS.delete(`${baseUrl}/mf/metas/analise-qualitativa/documento/${id}`)) {
        this.SingleMetaAnaliseDocs = this.SingleMetaAnaliseDocs.filter((x) => x.id !== id);
        return true;
      }
      return false;
    },
    async addMetaArquivo(params, dadosParaEnvio) {
      try {
        const { id = 0, download_token: downloadToken } = await this.requestS.patch(`${baseUrl}/mf/metas/analise-qualitativa/documento/`, params);

        if (id) {
          const dadosDoArquivo = {
            id,
            arquivo: {
              nome_original: dadosParaEnvio.arquivo.name,
              descricao: dadosParaEnvio.descricao,
              download_token: downloadToken || dadosParaEnvio.upload_token,
            },
          };

          this.SingleMetaAnaliseDocs.push(dadosDoArquivo);
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    },

    // Risco
    async getMetaRisco(ciclo_id, meta_id) {
      this.SingleRisco = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/mf/metas/risco?ciclo_fisico_id=${ciclo_id}&meta_id=${meta_id}&apenas_ultima_revisao=true`);
        this.SingleRisco = r;
        this.SingleRisco = r.riscos[0] ? r.riscos[0] : {};
      } catch (error) {
        this.SingleRisco = { error };
      }
    },
    async updateMetaRisco(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/risco`, params)) return true;
      return false;
    },

    // Fechamento
    async getMetaFechamento(ciclo_id, meta_id) {
      this.SingleFechamento = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/mf/metas/fechamento?ciclo_fisico_id=${ciclo_id}&meta_id=${meta_id}&apenas_ultima_revisao=true`);
        this.SingleFechamento = r.fechamentos[0] ? r.fechamentos[0] : {};
      } catch (error) {
        this.SingleFechamento = { error };
      }
    },
    async updateMetaFechamento(params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/fechamento`, params)) return true;
      return false;
    },

    // Cronograma
    async getCronogramas(p_id, parent_field) {
      try {
        if (!this.Cronogramas[parent_field]) this.Cronogramas[parent_field] = [];
        if (!this.Cronogramas[parent_field][p_id]) {
          this.Cronogramas[parent_field][p_id] = { loading: true };
          const r = await this.requestS.get(`${baseUrl}/mf/metas/cronograma?${parent_field}=${p_id}`);
          this.Cronogramas[parent_field][p_id] = r.linhas.map((x) => {
            x.inicio_previsto = this.dateToField(x.inicio_previsto);
            x.termino_previsto = this.dateToField(x.termino_previsto);
            x.inicio_real = this.dateToField(x.inicio_real);
            x.termino_real = this.dateToField(x.termino_real);
            return x;
          });
        }
        return true;
      } catch (error) {
        this.Cronogramas[parent_field][p_id] = { error };
      }
    },
    async getCronogramasActiveByParent(p_id, parent_field) {
      try {
        this.SingleCronograma = { loading: true };
        this.SingleCronogramaEtapas = { loading: true };

        this.SingleCronograma = await this.getCronogramasItemByParent(p_id, parent_field);
        this.getEtapasByCron(this.SingleCronograma?.id);
        return true;
      } catch (error) {
        this.SingleCronograma = { error };
      }
    },
    async getCronogramasItemByParent(p_id, parent_field) {
      try {
        await this.getCronogramas(p_id, parent_field);
        const r = this.Cronogramas[parent_field][p_id].length ? this.Cronogramas[parent_field][p_id][0] : {};
        return r;
      } catch (error) {
        return { error };
      }
    },
    async getEtapasByCron(cronograma_id) {
      try {
        this.SingleCronogramaEtapas = await this.getEtapasItemsByCron(cronograma_id);
      } catch (error) {
        this.SingleCronogramaEtapas = { error };
      }
    },
    async getEtapasItemsByCron(cronograma_id) {
      try {
        if (!cronograma_id) throw 'Cronograma inválido';
        await this.getEtapas(cronograma_id);
        return this.Etapas[cronograma_id];
      } catch (error) {
        return { error };
      }
    },
    async getEtapas(cronograma_id) {
      try {
        if (!this.Etapas[cronograma_id]) {
          this.Etapas[cronograma_id] = { loading: true };
          const r = await this.requestS.get(`${baseUrl}/mf/metas/cronograma-etapa?cronograma_id=${cronograma_id}`);
          this.Etapas[cronograma_id] = r.linhas.length ? r.linhas.map((x) => {
            if (x.cronograma_origem_etapa && x.cronograma_origem_etapa.id == cronograma_id) delete x.cronograma_origem_etapa;
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
          }).sort((a, b) => a.ordem - b.ordem) : r.linhas;
        }
        return true;
      } catch (error) {
        this.Etapas[cronograma_id] = { error };
      }
    },
    async getEtapaById(cronograma_id, etapa_id) {
      try {
        this.SingleEtapa = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/mf/metas/cronograma-etapa?cronograma_id=${cronograma_id}&etapa_id=${etapa_id}`);
        this.SingleEtapa = r.linhas.length ? r.linhas.map((x) => {
          if (x.etapa.inicio_previsto) x.etapa.inicio_previsto = this.dateToField(x.etapa.inicio_previsto);
          if (x.etapa.termino_previsto) x.etapa.termino_previsto = this.dateToField(x.etapa.termino_previsto);
          if (x.etapa.inicio_real) x.etapa.inicio_real = this.dateToField(x.etapa.inicio_real);
          if (x.etapa.termino_real) x.etapa.termino_real = this.dateToField(x.etapa.termino_real);
          if (x.etapa.prazo) x.etapa.prazo = this.dateToField(x.etapa.prazo);
          return x;
        })[0].etapa : {};
      } catch (error) {
        this.SingleEtapa = { error };
      }
    },
    async updateEtapa(id, params) {
      if (await this.requestS.patch(`${baseUrl}/mf/metas/cronograma/etapa/${id}`, params)) return true;
      return false;
    },
  },
  getters: {
    índiceDeSériesEmMetaVars: ({ MetaVars }) => retornarPosiçõesPorValor(MetaVars?.ordem_series),

    dadosExtrasPorVariávelId: ({ dadosExtrasDeVariaveis }) => (Array.isArray(dadosExtrasDeVariaveis)
      ? dadosExtrasDeVariaveis.reduce((acc, cur) => {
        if (cur.variavel?.id && !acc[cur.variavel.id]) {
          acc[cur.variavel.id] = {
            ...cur.variavel,
            ...cur,
          };
        }
        return acc;
      }, {})
      : {}),

    iniciativaEmFoco({ SingleMeta }) {
      const { iniciativa_id: iniciativaId } = this.route.params;

      return !Array.isArray(SingleMeta?.meta?.iniciativas)
        ? null
        : SingleMeta.meta.iniciativas
          .find((x) => x.iniciativa.id === Number(iniciativaId)) || null;
    },
    atividadeEmFoco({ iniciativaEmFoco }) {
      const { atividade_id: atividadeId } = this.route.params;

      return !Array.isArray(iniciativaEmFoco?.atividades)
        ? null
        : iniciativaEmFoco.atividades
          .find((x) => x.atividade.id === Number(atividadeId)) || null;
    },
  },
});
