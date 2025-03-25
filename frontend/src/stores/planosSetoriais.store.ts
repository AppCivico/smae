import dateTimeToDate from '@/helpers/dateTimeToDate';
import type { RecordWithId } from '@back/common/dto/record-with-id.dto';
import type {
  ListDadosMetaIniciativaAtividadesDto,
} from '@back/meta/dto/create-meta.dto';
import type { DetalhePSDto } from '@back/pdm/dto/detalhe-pdm.dto';
import type { ListPdmDto, OrcamentoConfig } from '@back/pdm/dto/list-pdm.dto';
import type { PlanoSetorialDto } from '@back/pdm/dto/pdm.dto';
import type { ListPdmDocument } from '@back/pdm/entities/list-pdm-document.entity';
import type { ListPdm } from '@back/pdm/entities/list-pdm.entity';
import { defineStore } from 'pinia';
import mapIniciativas from './helpers/mapIniciativas';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListPdmDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  arquivos: boolean;
  arvoreDeMetas: boolean;
}

interface Erros {
  lista: null | unknown;
  emFoco: null | unknown;
  arquivos: null | unknown;
  arvoreDeMetas: null | unknown;
}

type EmFoco = PlanoSetorialDto & { orcamento_config?: OrcamentoConfig[] | null };

export type TiposDeOrcamentosDisponiveis = {
  execucao_disponivel?: boolean;
  planejado_disponivel?: boolean;
  previsao_custo_disponivel?: boolean;
};

interface Estado {
  lista: Lista;
  emFoco: EmFoco | null;
  arquivos: ListPdmDocument['linhas'] | [];
  arvoreDeMetas: { [k: number]: unknown };
  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
}

export const usePlanosSetoriaisStore = (prefixo = '') => defineStore(prefixo ? `${prefixo}.planosSetoriais` : 'planosSetoriais', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    arquivos: [],
    arvoreDeMetas: [],

    chamadasPendentes: {
      lista: false,
      emFoco: false,
      arquivos: false,
      arvoreDeMetas: false,
    },
    erros: {
      lista: null,
      emFoco: null,
      arquivos: null,
      arvoreDeMetas: null,
    },
  }),
  actions: {
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial/${id}`, params) as DetalhePSDto | PlanoSetorialDto;

        this.emFoco = 'pdm' in resposta
          ? {
            ...resposta.pdm,
            orcamento_config: resposta.orcamento_config,
          }
          : {
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
        const { linhas } = await this.requestS.get(`${baseUrl}/plano-setorial`, params) as ListPdmDto;
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

    async salvarItem(params = {}, id = 0): Promise<boolean | RecordWithId> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        const resposta = id
          ? await this.requestS.patch(`${baseUrl}/plano-setorial/${id}`, params) as RecordWithId
          : await this.requestS.post(`${baseUrl}/plano-setorial`, params) as RecordWithId;

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
        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial/${idDoPlanoSetorial || this.route.params.planoSetorialId}/documento`, params) as ListPdmDocument;

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

    async associarArquivo(
      params = {},
      id = 0,
      idDoPlanoSetorial = 0,
    ): Promise<boolean | RecordWithId> {
      this.chamadasPendentes.arquivos = true;
      this.erros.arquivos = null;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/plano-setorial/${idDoPlanoSetorial || this.route.params.planoSetorialId}/documento/${id}`, params) as RecordWithId;
        } else {
          resposta = await this.requestS.post(`${baseUrl}/plano-setorial/${idDoPlanoSetorial || this.route.params.planoSetorialId}/documento`, params) as RecordWithId;
        }

        this.chamadasPendentes.arquivos = false;
        return resposta;
      } catch (erro) {
        this.erros.arquivos = erro;
        this.chamadasPendentes.arquivos = false;
        return false;
      }
    },

    async buscarArvoreDeMetas(params = {}): Promise<void> {
      this.chamadasPendentes.arvoreDeMetas = true;
      this.erros.arvoreDeMetas = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/plano-setorial-meta/iniciativas-atividades`, params) as ListDadosMetaIniciativaAtividadesDto;

        if (Array.isArray(linhas)) {
          linhas.forEach((cur) => {
            this.arvoreDeMetas[cur.id] = {
              ...cur,
              iniciativas: mapIniciativas(cur.iniciativas),
            };
          });
        }
      } catch (erro: unknown) {
        this.erros.arvoreDeMetas = erro;
      }
      this.chamadasPendentes.arvoreDeMetas = false;
    },

    async atualizarPermissoesOrcamento(id: number, params: Record<string, unknown>): Promise<void> {
      await this.requestS.patch(`${baseUrl}/plano-setorial/${id}/orcamento-config`, params);
    },
  },

  getters: {
    itemParaEdicao({ emFoco }) {
      let tipoPadrao;
      switch (this.route.meta.entidadeMãe) {
        case 'planoSetorial':
          tipoPadrao = 'PS';
          break;
        case 'programaDeMetas':
          tipoPadrao = 'PDM';
          break;
        default:
          throw new Error('Módulo não pôde ser detectado');
      }

      return {
        ...emFoco,

        // campo oculto
        tipo: emFoco?.tipo || tipoPadrao,

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
        meses: emFoco?.meses || [],
        possui_atividade: !!emFoco?.possui_atividade,
        possui_complementacao_meta: !!emFoco?.possui_complementacao_meta,
        possui_contexto_meta: !!emFoco?.possui_contexto_meta,
        possui_iniciativa: !!emFoco?.possui_iniciativa,
        possui_macro_tema: !!emFoco?.possui_macro_tema,
        possui_sub_tema: !!emFoco?.possui_sub_tema,
        possui_tema: !!emFoco?.possui_tema,
        prefeito: emFoco?.prefeito || '',
        ps_admin_cp: Array.isArray(emFoco?.ps_admin_cp?.equipes)
          ? emFoco.ps_admin_cp
          : { equipes: [] },
        ps_ponto_focal: Array.isArray(emFoco?.ps_ponto_focal?.equipes)
          ? emFoco.ps_ponto_focal
          : { equipes: [] },
        ps_tecnico_cp: Array.isArray(emFoco?.ps_tecnico_cp?.equipes)
          ? emFoco.ps_tecnico_cp
          : { equipes: [] },
        rotulo_atividade: emFoco?.rotulo_atividade || '',
        rotulo_complementacao_meta: emFoco?.rotulo_complementacao_meta || '',
        rotulo_contexto_meta: emFoco?.rotulo_contexto_meta || '',
        rotulo_iniciativa: emFoco?.rotulo_iniciativa || '',
        rotulo_macro_tema: emFoco?.rotulo_macro_tema || '',
        rotulo_sub_tema: emFoco?.rotulo_sub_tema || '',
        rotulo_tema: emFoco?.rotulo_tema || '',
        upload_logo: emFoco?.logo || null,
      };
    },

    arquivosPorId: ({ arquivos }: Estado) => {
      const result = arquivos.reduce((acc, cur) => ({
        ...acc,
        [cur.id]: {
          ...cur,
          arquivo: {
            ...cur.arquivo,
            descricao: cur.descricao,
            id: cur.id,
          },
        },
      }), {});
      return result;
    },

    orcamentosDisponiveisNoPlanoEmFoco: ({ emFoco }):TiposDeOrcamentosDisponiveis => {
      const disponiveis = {
        execucao_disponivel: false,
        planejado_disponivel: false,
        previsao_custo_disponivel: false,
      };

      if (Array.isArray(emFoco?.orcamento_config) && emFoco?.orcamento_config.length) {
        let i = 0;

        while (emFoco?.orcamento_config[i]) {
          const item = emFoco?.orcamento_config[i];

          if (item.execucao_disponivel) {
            disponiveis.execucao_disponivel = true;
          }
          if (item.planejado_disponivel) {
            disponiveis.planejado_disponivel = true;
          }
          if (item.previsao_custo_disponivel) {
            disponiveis.previsao_custo_disponivel = true;
          }

          if (
            disponiveis.execucao_disponivel
            && disponiveis.planejado_disponivel
            && disponiveis.previsao_custo_disponivel
          ) {
            break;
          }

          i += 1;
        }
      }

      return disponiveis;
    },

    planosSetoriaisPorId: ({ lista }: Estado): { [k: number | string]: ListPdm } => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    planoAtivo: ({ lista }: Estado): ListPdm | null => lista.find((x) => x.ativo) || null,
  },
})();
