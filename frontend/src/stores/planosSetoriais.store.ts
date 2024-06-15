import dateTimeToDate from '@/helpers/dateTimeToDate';
import { defineStore } from 'pinia';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ListPdmDto } from '@/../../backend/src/pdm/dto/list-pdm.dto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { PlanoSetorialDto } from '@/../../backend/src/pdm/dto/pdm.dto';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListPdmDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Erros {
  lista: null | unknown;
  emFoco: null | unknown;
}

interface Estado {
  lista: Lista;
  emFoco: PlanoSetorialDto | null;
  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
}

export const usePlanosSetoriaisStore = defineStore('planosSetoriais', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erros: {
      lista: null,
      emFoco: null,
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
      upload_logo: emFoco?.logo || null,
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
      ps_admin_cp: Array.isArray(emFoco?.ps_admin_cp?.participantes)
        ? emFoco.ps_admin_cp
        : { participantes: [] },
      ps_ponto_focal: Array.isArray(emFoco?.ps_ponto_focal?.participantes)
        ? emFoco.ps_ponto_focal
        : { participantes: [] },
      ps_tecnico_cp: Array.isArray(emFoco?.ps_tecnico_cp?.participantes)
        ? emFoco.ps_tecnico_cp
        : { participantes: [] },
    }),

    planosSetoriaisPorId: ({ lista }: Estado): { [k: number | string]: Pdm } => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
