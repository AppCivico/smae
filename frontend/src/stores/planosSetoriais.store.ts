import dateTimeToDate from '@/helpers/dateTimeToDate';
import { defineStore } from 'pinia';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ListPdmDto } from '@/../../backend/src/pdm/dto/list-pdm.dto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { PlanoSetorialDto } from '@/../../backend/src/pdm/dto/pdm.dto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ListPdmDocument } from '@/../../backend/src/pdm/entities/list-pdm-document.entity';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ListPdm } from '@/../../backend/src/pdm/entities/list-pdm.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListPdmDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  arquivos: boolean;
}

interface Erros {
  lista: null | unknown;
  emFoco: null | unknown;
  arquivos: null | unknown;
}

interface Estado {
  lista: Lista;
  emFoco: PlanoSetorialDto | null;
  arquivos: ListPdmDocument['linhas'] | [];

  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
}

export const usePlanosSetoriaisStore = defineStore('planosSetoriais', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    arquivos: [],

    chamadasPendentes: {
      lista: false,
      emFoco: false,
      arquivos: false,
    },
    erros: {
      lista: null,
      emFoco: null,
      arquivos: null,
    },
  }),
  actions: {
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial/${id}`, params);
        this.emFoco = {
          ...resposta,
        };
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/plano-setorial`, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erros.lista = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;
      this.erros.emFoco = null;

      try {
        await this.requestS.delete(`${baseUrl}/plano-setorial/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        const resposta = id
          ? await this.requestS.patch(`${baseUrl}/plano-setorial/${id}`, params)
          : await this.requestS.post(`${baseUrl}/plano-setorial`, params);

        this.chamadasPendentes.emFoco = false;
        return resposta;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async buscarArquivos(idDoPlanoSetorial = 0, params = {}): Promise<void> {
      this.chamadasPendentes.arquivos = true;
      this.erros.arquivos = null;

      try {
        const resposta: ListPdmDocument = await this.requestS.get(`${baseUrl}/plano-setorial/${idDoPlanoSetorial || this.route.params.planoSetorialId}/documento`, params);

        if (Array.isArray(resposta.linhas)) {
          this.arquivos = resposta.linhas;
        }
      } catch (erro: unknown) {
        this.erros.arquivos = erro;
      }
      this.chamadasPendentes.arquivos = false;
    },

    async excluirArquivo(idDoArquivo: number, idDoPlanoSetorial = 0): Promise<boolean> {
      this.chamadasPendentes.arquivos = true;
      this.erros.arquivos = null;

      try {
        await this.requestS.delete(`${baseUrl}/plano-setorial/${idDoPlanoSetorial || this.route.params.planoSetorialId}/documento/${idDoArquivo}`);

        this.arquivos = this.arquivos.filter((x) => x.id !== idDoArquivo);
        this.chamadasPendentes.arquivos = false;

        return true;
      } catch (erro) {
        this.erros.arquivos = erro;
        this.chamadasPendentes.arquivos = false;
        return false;
      }
    },

    async associarArquivo(params = {}, id=0, idDoPlanoSetorial = 0,): Promise<boolean> {
      this.chamadasPendentes.arquivos = true;
      this.erros.arquivos = null;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/plano-setorial/${idDoPlanoSetorial || this.route.params.planoSetorialId}/documento/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/plano-setorial/${idDoPlanoSetorial || this.route.params.planoSetorialId}/documento`, params);
        }

        this.chamadasPendentes.arquivos = false;
        return resposta;
      } catch (erro) {
        this.erros.arquivos = erro;
        this.chamadasPendentes.arquivos = false;
        return false;
      }
    },
  },

  getters: {
    itemParaEdição: ({ emFoco }) => ({
      ...emFoco,
      data_fim: emFoco?.data_fim
        ? dateTimeToDate(emFoco.data_fim)
        : null,
      data_inicio: emFoco?.data_inicio
        ? dateTimeToDate(emFoco.data_inicio)
        : null,
      data_publicacao: emFoco?.data_publicacao
        ? dateTimeToDate(emFoco.data_publicacao)
        : null,
      equipe_tecnica: emFoco?.equipe_tecnica || '',
      monitoramento_orcamento: !!emFoco?.monitoramento_orcamento,
      nome: emFoco?.nome || '',
      orgao_admin_id: emFoco?.orgao_admin?.id || null,
      pdm_anteriores: Array.isArray(emFoco?.pdm_anteriores)
        ? emFoco.pdm_anteriores.map((pdm) => pdm.id || pdm)
        : [],
      periodo_do_ciclo_participativo_fim: emFoco?.periodo_do_ciclo_participativo_fim
        ? dateTimeToDate(emFoco.periodo_do_ciclo_participativo_fim)
        : null,
      periodo_do_ciclo_participativo_inicio: emFoco?.periodo_do_ciclo_participativo_inicio
        ? dateTimeToDate(emFoco.periodo_do_ciclo_participativo_inicio)
        : null,
      possui_atividade: !!emFoco?.possui_atividade,
      possui_complementacao_meta: !!emFoco?.possui_complementacao_meta,
      possui_contexto_meta: !!emFoco?.possui_contexto_meta,
      possui_iniciativa: !!emFoco?.possui_iniciativa,
      possui_macro_tema: !!emFoco?.possui_macro_tema,
      possui_sub_tema: !!emFoco?.possui_sub_tema,
      possui_tema: !!emFoco?.possui_tema,
      prefeito: emFoco?.prefeito || '',
      ps_admin_cp: Array.isArray(emFoco?.ps_admin_cp?.participantes)
        ? emFoco.ps_admin_cp
        : { participantes: [] },
      ps_ponto_focal: Array.isArray(emFoco?.ps_ponto_focal?.participantes)
        ? emFoco.ps_ponto_focal
        : { participantes: [] },
      ps_tecnico_cp: Array.isArray(emFoco?.ps_tecnico_cp?.participantes)
        ? emFoco.ps_tecnico_cp
        : { participantes: [] },
      rotulo_atividade: emFoco?.rotulo_atividade || '',
      rotulo_complementacao_meta: emFoco?.rotulo_complementacao_meta || '',
      rotulo_contexto_meta: emFoco?.rotulo_contexto_meta || '',
      rotulo_iniciativa: emFoco?.rotulo_iniciativa || '',
      rotulo_macro_tema: emFoco?.rotulo_macro_tema || '',
      rotulo_sub_tema: emFoco?.rotulo_sub_tema || '',
      rotulo_tema: emFoco?.rotulo_tema || '',
      upload_logo: emFoco?.logo || null,
    }),
    
    arquivosPorId: ({ arquivos }: Estado) => {
      const result = arquivos.reduce((acc, cur) => {
        return {
          ...acc,
          [cur.id]: {
            ...cur,
            arquivo: {
              ...cur.arquivo,
              descricao: cur.descricao,
              id: cur.id,
            }
          },
        };
      }, {});
      return result;
    },

    planosSetoriaisPorId: ({ lista }: Estado): { [k: number | string]: ListPdm } => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
