import type { ParametrosDeRequisicao } from '@/helpers/requestS';
import type {
  CicloFisicoPSDto,
  ListPSCicloDto,
  UltimaRevisao,
} from '@back/pdm-ciclo/entities/pdm-ciclo.entity';
import type {
  CreatePsCicloFaseDocumentoDto,
  SalvarPsCicloFaseDto,
} from '@back/pdm-ciclo/dto/ps-ciclo-fase.dto';
import type { PsCicloFasesDto } from '@back/pdm-ciclo/entities/ps-ciclo-fase.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChaveGenerica = string | number;
type RespostaDeEnvio = RecordWithId | false;
type PrefixosValidos = 'planoSetorial' | 'programaDeMetas';

type ChamadasPendentes = {
  listaDeCiclos: boolean;

  ciclosDetalhadosPorId: Record<ChaveGenerica, boolean>;

  fasesDoCicloEmFoco: boolean;
  reabrirCiclo: Record<ChaveGenerica, boolean>;

  documento: boolean;
};

type Erros = {
  listaDeCiclos: unknown;

  ciclosDetalhadosPorId: Record<ChaveGenerica, unknown>;

  fasesDoCicloEmFoco: unknown;
  reabrirCiclo: Record<ChaveGenerica, unknown>;

  documento: unknown;
};

type Estado = {
  listaDeCiclos: ListPSCicloDto['linhas'];

  ultimaRevisao: UltimaRevisao | null;

  ciclosDetalhadosPorId: Record<ChaveGenerica, PsCicloFasesDto>;

  fasesDoCicloEmFoco: PsCicloFasesDto | null;

  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
};

export const useMonitoramentoDeMetasStore = (prefixo: PrefixosValidos) => defineStore(prefixo ? `${prefixo}.monitoramentoDeMetas` : 'monitoramentoDeMetas', {
  state: (): Estado => ({
    listaDeCiclos: [],

    ultimaRevisao: null,

    ciclosDetalhadosPorId: {},

    fasesDoCicloEmFoco: null,

    chamadasPendentes: {
      listaDeCiclos: false,
      ciclosDetalhadosPorId: {},
      fasesDoCicloEmFoco: false,
      reabrirCiclo: {},
      documento: false,
    },

    erros: {
      listaDeCiclos: null,
      ciclosDetalhadosPorId: {},
      fasesDoCicloEmFoco: null,
      reabrirCiclo: {},
      documento: null,
    },
  }),
  actions: {
    async buscarListaDeCiclos(pdmId: string | number, params = {}): Promise<void> {
      this.chamadasPendentes.listaDeCiclos = true;

      try {
        const {
          linhas,
          ultima_revisao: ultimaRevisao,
        } = await this.requestS.get(`${baseUrl}/plano-setorial/${pdmId}/ciclo`, params) as ListPSCicloDto;

        this.listaDeCiclos = linhas;
        this.ultimaRevisao = ultimaRevisao;

        this.erros.listaDeCiclos = null;
      } catch (erro: unknown) {
        this.erros.listaDeCiclos = erro;
      }

      this.chamadasPendentes.listaDeCiclos = false;
    },

    async buscarCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params = {}): Promise<void> {
      this.chamadasPendentes.ciclosDetalhadosPorId[cicloId] = true;
      try {
        delete this.erros.ciclosDetalhadosPorId[cicloId];

        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/fase`, params) as PsCicloFasesDto;

        console.debug('Resposta do ciclo detalhado:', resposta);

        this.ciclosDetalhadosPorId[cicloId] = resposta;
      } catch (erro: unknown) {
        this.erros.ciclosDetalhadosPorId[cicloId] = erro;
      }
      this.chamadasPendentes.ciclosDetalhadosPorId[cicloId] = false;
    },

    limparCiclos() {
      this.ciclosDetalhadosPorId = {};
      this.listaDeCiclos.splice(0);
    },

    // eslint-disable-next-line max-len
    async buscarFasesDoCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params = {}): Promise<void> {
      this.chamadasPendentes.fasesDoCicloEmFoco = true;

      try {
        this.erros.fasesDoCicloEmFoco = null;

        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/fase`, params) as PsCicloFasesDto;

        this.fasesDoCicloEmFoco = resposta;
      } catch (erro: unknown) {
        this.erros.fasesDoCicloEmFoco = erro;
      }
      this.chamadasPendentes.fasesDoCicloEmFoco = false;
    },

    // eslint-disable-next-line max-len
    async salvarFaseDoCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, faseId: ChaveGenerica, metaId: ChaveGenerica, params: SalvarPsCicloFaseDto): Promise<RespostaDeEnvio> {
      this.chamadasPendentes.fasesDoCicloEmFoco = true;

      try {
        // a meta é informada na query, não no corpo da requisição
        const resposta = await this.requestS.post(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/fase/${faseId}?meta_id=${metaId}`, params) as RecordWithId;

        this.chamadasPendentes.fasesDoCicloEmFoco = false;

        this.erros.fasesDoCicloEmFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.fasesDoCicloEmFoco = erro;
        this.chamadasPendentes.fasesDoCicloEmFoco = false;
        return false;
      }
    },

    // eslint-disable-next-line max-len
    async associarDocumentoComFase(pdmId: ChaveGenerica, cicloId: ChaveGenerica, faseId: ChaveGenerica, metaId: ChaveGenerica, params: CreatePsCicloFaseDocumentoDto): Promise<RespostaDeEnvio> {
      this.chamadasPendentes.documento = true;

      this.erros.documento = null;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/fase/${faseId}/documento?meta_id=${metaId}`, params) as RecordWithId;

        this.chamadasPendentes.documento = false;

        return resposta;
      } catch (erro) {
        this.erros.documento = erro;
        this.chamadasPendentes.documento = false;
        return false;
      }
    },

    // eslint-disable-next-line max-len
    async desassociarDocumentoDeFase(pdmId: ChaveGenerica, cicloId: ChaveGenerica, documentoId: ChaveGenerica, metaId: ChaveGenerica): Promise<boolean> {
      this.chamadasPendentes.documento = true;
      this.erros.documento = null;

      try {
        await this.requestS.delete(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/fase-documento/${documentoId}?meta_id=${metaId}`);
        this.chamadasPendentes.documento = false;

        return true;
      } catch (erro) {
        this.erros.documento = erro;
        this.chamadasPendentes.documento = false;
        return false;
      }
    },

    // eslint-disable-next-line max-len
    async reabrirCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params: ParametrosDeRequisicao): Promise<boolean> {
      this.chamadasPendentes.reabrirCiclo[cicloId] = true;

      try {
        await this.requestS.post(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/reabrir`, params);

        delete this.chamadasPendentes.reabrirCiclo[cicloId];

        delete this.erros.reabrirCiclo[cicloId];
        return true;
      } catch (erro) {
        this.erros.reabrirCiclo[cicloId] = erro;
        delete this.chamadasPendentes.reabrirCiclo[cicloId];
        return false;
      }
    },
  },
  getters: {
    cicloAtivo: ({ listaDeCiclos }) => listaDeCiclos.find((ciclo) => ciclo.ativo),

    listaDeCiclosPassados: ({ listaDeCiclos }):CicloFisicoPSDto[] => listaDeCiclos
      .filter((ciclo) => !ciclo.ativo),

    ciclosPorId: ({ listaDeCiclos }) => listaDeCiclos.reduce((acc, ciclo) => {
      acc[ciclo.id] = ciclo;
      return acc;
    }, {} as Record<number, CicloFisicoPSDto>),

    ciclosPassadosPorAno() {
      return this.listaDeCiclosPassados.reduce((acc, ciclo) => {
        const ano = ciclo.data_ciclo.split('-')[0];

        if (!acc[ano]) {
          acc[ano] = [];
        }

        acc[ano].push(ciclo);
        return acc;
      }, {} as Record<string, CicloFisicoPSDto[]>);
    },

    anosDisponiveisNosCiclosPassados() {
      return Object.keys(this.ciclosPassadosPorAno).reduce((acc, ano) => {
        const anoDoItem = Number(ano);
        if (!Number.isNaN(anoDoItem)) {
          acc.push(anoDoItem);
        }
        return acc;
      }, [] as number[]);
    },

    anoMaisRecenteNosCiclosPassados() {
      // eslint-disable-next-line max-len
      return this.anosDisponiveisNosCiclosPassados[this.anosDisponiveisNosCiclosPassados.length - 1];
    },
  },
})();
