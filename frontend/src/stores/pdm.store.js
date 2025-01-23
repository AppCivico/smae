import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useMacrotemasStore } from '@/stores/macrotemas.store';
import { useSubtemasStore } from '@/stores/subtemas.store';
import { useTagsStore } from '@/stores/tags.store';
import { useTemasStore } from '@/stores/temas.store';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return 'pdm';
    case 'planoSetorial':
    case 'programaDeMetas':
      return 'plano-setorial';
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

export const usePdMStore = defineStore({
  id: 'PdM',
  state: () => ({
    PdM: {},
    tempPdM: {},
    singlePdm: {},
    activePdm: {},
    arquivos: {},
  }),
  actions: {
    clear() {
      this.PdM = {};
      this.tempPdM = {};
      this.singlePdm = {};
      this.activePdm = {};
      this.arquivos = {};
    },
    clearEdit() {
      this.singlePdm = {};
      this.activePdm = {};
      this.arquivos = {};
    },
    clearLoad() {
      this.PdM = {};
      this.singleArquivo = {};
    },
    dateToField(d) {
      const dd = d ? new Date(d) : false;
      return (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }) : '';
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
    waitForPdm(resolve, reject) {
      if (this.activePdm.id) resolve(1);
      else setTimeout(this.waitForPdm.bind(this, resolve, reject), 300);
    },
    async getAll() {
      try {
        if (this.PdM.loading) return;
        this.PdM = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}`);
        if (r.linhas.length) {
          const macrotemasStore = useMacrotemasStore();
          const subtemasStore = useSubtemasStore();
          const TemasStore = useTemasStore();
          const tagsStore = useTagsStore();

          await Promise.all([
            !macrotemasStore.Macrotemas.length && !macrotemasStore.Macrotemas.loading && macrotemasStore.getAllSimple(),
            !subtemasStore.Subtemas.length && !subtemasStore.Subtemas.loading && subtemasStore.getAllSimple(),
            !TemasStore.Temas.length && !TemasStore.Temas.loading && TemasStore.getAllSimple(),
            !tagsStore.Tags.length && !tagsStore.Tags.loading && tagsStore.getAllSimple(),
          ]);

          this.PdM = r.linhas.map((x) => {
            x.data_inicio = this.dateToField(x.data_inicio);
            x.data_fim = this.dateToField(x.data_fim);
            x.data_publicacao = this.dateToField(x.data_publicacao);
            x.periodo_do_ciclo_participativo_inicio = this.dateToField(x.periodo_do_ciclo_participativo_inicio);
            x.periodo_do_ciclo_participativo_fim = this.dateToField(x.periodo_do_ciclo_participativo_fim);
            x.macrotemas = macrotemasStore?.Macrotemas?.length ? macrotemasStore.Macrotemas.filter((z) => z.pdm_id == x.id) : [];
            x.subtemas = subtemasStore?.Subtemas?.length ? subtemasStore.Subtemas.filter((z) => z.pdm_id == x.id) : [];
            x.temas = TemasStore?.Temas?.length ? TemasStore.Temas.filter((z) => z.pdm_id == x.id) : [];
            x.tags = tagsStore?.Tags?.length ? tagsStore.Tags.filter((z) => z.pdm_id == x.id) : [];

            return x;
          });
        } else {
          this.PdM = r.linhas;
        }
      } catch (error) {
        this.PdM = { error };
      }
    },
    async getById(id) {
      this.singlePdm = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}?incluir_auxiliares=true`);
        if (r.pdm) {
          this.singlePdm = ((x) => {
            x.pdm.data_inicio = this.dateToField(x.pdm.data_inicio);
            x.pdm.data_fim = this.dateToField(x.pdm.data_fim);
            x.pdm.data_publicacao = this.dateToField(x.pdm.data_publicacao);
            x.pdm.periodo_do_ciclo_participativo_inicio = this.dateToField(x.pdm.periodo_do_ciclo_participativo_inicio);
            x.pdm.periodo_do_ciclo_participativo_fim = this.dateToField(x.pdm.periodo_do_ciclo_participativo_fim);
            x.pdm.ativo = x.pdm.ativo ? '1' : false;

            x.pdm.possui_macro_tema = x.pdm.possui_macro_tema ? '1' : false;
            x.pdm.possui_tema = x.pdm.possui_tema ? '1' : false;
            x.pdm.possui_sub_tema = x.pdm.possui_sub_tema ? '1' : false;
            x.pdm.possui_contexto_meta = x.pdm.possui_contexto_meta ? '1' : false;
            x.pdm.possui_complementacao_meta = x.pdm.possui_complementacao_meta ? '1' : false;
            x.pdm.possui_iniciativa = x.pdm.possui_iniciativa ? '1' : false;
            x.pdm.possui_atividade = x.pdm.possui_atividade ? '1' : false;

            x.pdm.eixo = x.eixo;
            x.pdm.orcamento_config = x.orcamento_config;
            x.pdm.sub_tema = x.sub_tema;
            x.pdm.tag = x.tag;
            x.pdm.tema = x.tema;
            return x.pdm;
          })(r);
        } else {
          this.singlePdm = r;
        }
      } catch (error) {
        this.singlePdm = { error };
      }
    },
    async getActive() {
      try {
        if (!this.activePdm.id && !this.activePdm.loading) {
          this.activePdm = { loading: true };
          const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}?ativo=true`);
          if (r.linhas.length) {
            this.activePdm = ((x) => {
              x.data_inicio = this.dateToField(x.data_inicio);
              x.data_fim = this.dateToField(x.data_fim);
              x.data_publicacao = this.dateToField(x.data_publicacao);
              x.periodo_do_ciclo_participativo_inicio = this.dateToField(x.periodo_do_ciclo_participativo_inicio);
              x.periodo_do_ciclo_participativo_fim = this.dateToField(x.periodo_do_ciclo_participativo_fim);
              x.ativo = x.ativo ? '1' : false;

              x.possui_macro_tema = x.possui_macro_tema ? '1' : false;
              x.possui_tema = x.possui_tema ? '1' : false;
              x.possui_sub_tema = x.possui_sub_tema ? '1' : false;
              x.possui_contexto_meta = x.possui_contexto_meta ? '1' : false;
              x.possui_complementacao_meta = x.possui_complementacao_meta ? '1' : false;
              x.possui_iniciativa = x.possui_iniciativa ? '1' : false;
              x.possui_atividade = x.possui_atividade ? '1' : false;

              return x;
            })(r.linhas[0]);
            if (r.ciclo_fisico_ativo) this.activePdm.ciclo_fisico_ativo = r.ciclo_fisico_ativo;
            if (r.orcamento_config) this.activePdm.orcamento_config = r.orcamento_config;
            return this.activePdm;
          }
          const alertStore = useAlertStore();
          alertStore.error('Programa de Metas não encontrado');
          router.go(-1);
          return false;
        } if (this.activePdm.loading) {
          await new Promise(this.waitForPdm);
          return this.activePdm;
        }
        return this.activePdm;
      } catch (error) {
        this.activePdm = { error };
        return false;
      }
    },
    async insert(params) {
      const m = {
        nome: params.nome,
        descricao: params.descricao,
        prefeito: params.prefeito,
        equipe_tecnica: params.equipe_tecnica,
        data_inicio: this.fieldToDate(params.data_inicio),
        data_fim: this.fieldToDate(params.data_fim),
        data_publicacao: this.fieldToDate(params.data_publicacao),
        periodo_do_ciclo_participativo_inicio: this.fieldToDate(params.periodo_do_ciclo_participativo_inicio),
        periodo_do_ciclo_participativo_fim: this.fieldToDate(params.periodo_do_ciclo_participativo_fim),
        ativo: !!params.ativo,

        possui_macro_tema: !!params.possui_macro_tema,
        possui_tema: !!params.possui_tema,
        possui_sub_tema: !!params.possui_sub_tema,
        possui_contexto_meta: !!params.possui_contexto_meta,
        possui_complementacao_meta: !!params.possui_complementacao_meta,
        possui_iniciativa: !!params.possui_iniciativa,
        possui_atividade: !!params.possui_atividade,

        rotulo_macro_tema: params.rotulo_macro_tema,
        rotulo_tema: params.rotulo_tema,
        rotulo_sub_tema: params.rotulo_sub_tema,
        rotulo_contexto_meta: params.rotulo_contexto_meta,
        rotulo_complementacao_meta: params.rotulo_complementacao_meta,
        rotulo_iniciativa: params.rotulo_iniciativa,
        rotulo_atividade: params.rotulo_atividade,

        upload_logo: params.upload_logo,

        nivel_orcamento: params.nivel_orcamento,
      };
      if (await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta)}`, m)) {
        this.activePdm = {};
        return true;
      }
      return false;
    },
    async update(id, params) {
      const m = {
        ativo: !!params.ativo,
        nome: params.nome,
        descricao: params.descricao,
        prefeito: params.prefeito,
        equipe_tecnica: params.equipe_tecnica,
        data_inicio: this.fieldToDate(params.data_inicio),
        data_fim: this.fieldToDate(params.data_fim),
        data_publicacao: this.fieldToDate(params.data_publicacao),
        periodo_do_ciclo_participativo_inicio:
          this.fieldToDate(params.periodo_do_ciclo_participativo_inicio),
        periodo_do_ciclo_participativo_fim:
          this.fieldToDate(params.periodo_do_ciclo_participativo_fim),

        possui_macro_tema: !!params.possui_macro_tema,
        possui_tema: !!params.possui_tema,
        possui_sub_tema: !!params.possui_sub_tema,
        possui_contexto_meta: !!params.possui_contexto_meta,
        possui_complementacao_meta: !!params.possui_complementacao_meta,
        possui_iniciativa: !!params.possui_iniciativa,
        possui_atividade: !!params.possui_atividade,

        rotulo_macro_tema: params.rotulo_macro_tema,
        rotulo_tema: params.rotulo_tema,
        rotulo_sub_tema: params.rotulo_sub_tema,
        rotulo_contexto_meta: params.rotulo_contexto_meta,
        rotulo_complementacao_meta: params.rotulo_complementacao_meta,
        rotulo_iniciativa: params.rotulo_iniciativa,
        rotulo_atividade: params.rotulo_atividade,

        upload_logo: params.upload_logo,

        nivel_orcamento: params.nivel_orcamento,
      };
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`, m)) {
        this.activePdm = {};
        return true;
      }
      return false;
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`)) {
        this.activePdm = {};
        return true;
      }
      return false;
    },
    async filterPdM(f) {
      if (!this.tempPdM.length) this.tempPdM = { loading: true };
      try {
        await this.getAll();
        this.tempPdM = f && this.PdM.length
          ? this.PdM
            .filter((u) => (f.textualSearch
              ? (u.descricao + u.titulo + u.numero).toLowerCase()
                .includes(f.textualSearch.toLowerCase())
              : 1))
          : this.PdM;
        if (this.tempPdM.length) {
          this.tempPdM
            .forEach((u) => {
              this.carregaArquivos(u.id);
            });
        }
      } catch (error) {
        this.tempPdM = { error };
      }
    },
    async insertArquivo(pdm_id, params) {
      if (await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${pdm_id}/documento`, params)) {
        return true;
      }
      return false;
    },
    async deleteArquivo(pdm_id, id) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${pdm_id}/documento/${id}`)) {
        this.arquivos[pdm_id] = {};
        this.carregaArquivos(pdm_id);
        return true;
      }
      return false;
    },
    async carregaArquivos(pdm_id) {
      if (!this.arquivos[pdm_id]?.length) this.arquivos[pdm_id] = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${pdm_id}/documento`);
        this.arquivos[pdm_id] = r.linhas;
      } catch (error) {
        this.arquivos[pdm_id] = { error };
      }
    },

    async updatePermissoesOrcamento(id, params) {
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}/orcamento-config`, params)) {
        this.activePdm = {};
        return true;
      }
      return false;
    },

  },
});
