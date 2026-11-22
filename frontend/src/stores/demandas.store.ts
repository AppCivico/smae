import type {
  DemandaDetailDto, DemandaDto, DemandaHistoricoDto, ListDemandaDto,
} from '@back/casa-civil/demanda/entities/demanda.entity';
import type { CreateDemandaDto } from '@back/casa-civil/demanda/dto/create-demanda.dto';
import type { CreateDemandaAcaoDto } from '@back/casa-civil/demanda/acao/dto/acao.dto';
import type { FilterDemandaDto } from '@back/casa-civil/demanda/dto/filter-demanda.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = DemandaDto[];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  historico: boolean;
}

interface Paginacao {
  tokenProximaPagina: string | null;
  temMais: boolean;
  total: number;
}

interface Estado {
  lista: Lista;
  emFoco: DemandaDetailDto | null;
  historico: DemandaHistoricoDto[];
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
  erroHistorico: null | unknown;
  paginacao: Paginacao;
}

export const useDemandasStore = defineStore('demandasStore', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    historico: [],
    chamadasPendentes: {
      lista: false,
      emFoco: false,
      historico: false,
    },
    erro: null,
    erroHistorico: null,
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

    async buscarHistorico(id: number): Promise<void> {
      this.chamadasPendentes.historico = true;
      this.erroHistorico = null;
      try {
        const resposta: DemandaHistoricoDto[] = await this.requestS.get(
          `${baseUrl}/demanda/${id}/historico`,
        );
        this.historico = Array.isArray(resposta) ? resposta : [];
      } catch (erro: unknown) {
        this.erroHistorico = erro;
      }
      this.chamadasPendentes.historico = false;
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
      acao_ids: emFoco?.acoes?.map((i) => i.id) ?? [],
      finalidade: emFoco?.finalidade ?? '',
      orgao_id: emFoco?.orgao?.id ?? 0,
      area_tematica_id: emFoco?.area_tematica?.id ?? 0,
      arquivos: emFoco?.arquivos || [],
      localizacoes: emFoco?.geolocalizacao?.map((g) => g.token) || [],
    }),

    geolocalizacaoPorToken: ({ emFoco }) => (Array.isArray(emFoco?.geolocalizacao)
      ? emFoco?.geolocalizacao.reduce((acc, cur) => {
        acc[cur.token] = cur;
        return acc;
      }, {} as { [key: string]: any })
      : {}),
  },
});
