import type { DemandaDetailDto, DemandaDto, ListDemandaDto } from '@back/casa-civil/demanda/entities/demanda.entity';
import type { CreateDemandaDto } from '@back/casa-civil/demanda/dto/create-demanda.dto';
import type { CreateDemandaAcaoDto } from '@back/casa-civil/demanda/acao/dto/acao.dto';
import type { FilterDemandaDto } from '@back/casa-civil/demanda/dto/filter-demanda.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = DemandaDto[];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Paginacao {
  tokenProximaPagina: string | null;
  temMais: boolean;
  total: number;
}

interface Estado {
  lista: Lista;
  emFoco: DemandaDetailDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
  paginacao: Paginacao;
}

export const useDemandasStore = defineStore('demandasStore', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
    paginacao: {
      tokenProximaPagina: null,
      temMais: false,
      total: 0,
    },
  }),

  actions: {
    async buscarItem(id: number, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;
      try {
        const resposta: DemandaDetailDto = await this.requestS.get(
          `${baseUrl}/demanda/${id}`,
          params,
        );
        this.emFoco = { ...resposta };
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params: FilterDemandaDto = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        const resposta: ListDemandaDto = await this.requestS.get(
          `${baseUrl}/demanda`,
          params,
        );
        this.lista = resposta.linhas || [];
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async criarItem(params: CreateDemandaDto): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;
      try {
        await this.requestS.post(`${baseUrl}/demanda`, params);
        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro: unknown) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async atualizarItem(params: CreateDemandaAcaoDto): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        await this.requestS.patch(`${baseUrl}/demanda-acao`, params);
        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro: unknown) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        await this.requestS.delete(`${baseUrl}/demanda/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro: unknown) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },
  },

  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      orgao_id: [emFoco?.orgao?.id ?? undefined],
    }),

    geolocalizacaoPorToken: ({ emFoco }) => (Array.isArray(emFoco?.geolocalizacao)
      ? Object.groupBy(emFoco.geolocalizacao, (cur) => cur.token)
      : {}),
  },
});
