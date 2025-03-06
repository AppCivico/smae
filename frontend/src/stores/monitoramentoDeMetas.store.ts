import type { ParametrosDeRequisicao } from '@/helpers/requestS';
import type { RecordWithId } from '@back/common/dto/record-with-id.dto';
import type {
  CicloFisicoPSDto,
  CiclosRevisaoDto,
  ListPSCicloDto,
  PsListAnaliseQualitativaDto,
  PsListFechamentoDto,
  PsListRiscoDto,
  UltimaRevisao,
} from '@back/pdm-ciclo/entities/pdm-ciclo.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChaveGenerica = string | number;
type RespostaDeEnvio = RecordWithId | false;
type PrefixosValidos = 'planoSetorial' | 'programaDeMetas';

type ChamadasPendentes = {
  listaDeCiclos: boolean;

  ciclosDetalhadosPorId: Record<ChaveGenerica, boolean>;

  analiseEmFoco: boolean;
  riscoEmFoco: boolean;
  fechamentoEmFoco: boolean;

  documento: boolean;
};

type Erros = {
  listaDeCiclos: unknown;

  ciclosDetalhadosPorId: Record<ChaveGenerica, unknown>;

  analiseEmFoco: unknown;
  riscoEmFoco: unknown;
  fechamentoEmFoco: unknown;

  documento: unknown;
};

type Estado = {
  listaDeCiclos: ListPSCicloDto['linhas'];

  ultimaRevisao: UltimaRevisao | null;

  ciclosDetalhadosPorId: Record<ChaveGenerica, CiclosRevisaoDto>;

  analiseEmFoco: PsListAnaliseQualitativaDto | null;
  riscoEmFoco: PsListRiscoDto | null;
  fechamentoEmFoco: PsListFechamentoDto | null;

  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
};

export const useMonitoramentoDeMetasStore = (prefixo: PrefixosValidos) => defineStore(prefixo ? `${prefixo}.monitoramentoDeMetas` : 'monitoramentoDeMetas', {
  state: (): Estado => ({
    listaDeCiclos: [],
    ultimaRevisao: null,

    ciclosDetalhadosPorId: {},

    analiseEmFoco: null,
    riscoEmFoco: null,
    fechamentoEmFoco: null,

    chamadasPendentes: {
      listaDeCiclos: false,
      ciclosDetalhadosPorId: {},
      analiseEmFoco: false,
      riscoEmFoco: false,
      fechamentoEmFoco: false,
      documento: false,
    },

    erros: {
      listaDeCiclos: null,
      ciclosDetalhadosPorId: {},
      analiseEmFoco: null,
      riscoEmFoco: null,
      fechamentoEmFoco: null,
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

        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/monitoramento`, params) as CiclosRevisaoDto;

        this.ciclosDetalhadosPorId[cicloId] = resposta;
      } catch (erro: unknown) {
        this.erros.ciclosDetalhadosPorId[cicloId] = erro;
      }
      this.chamadasPendentes.ciclosDetalhadosPorId[cicloId] = false;
    },

    // eslint-disable-next-line max-len
    async buscarAnaliseDoCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params = {}): Promise<void> {
      this.chamadasPendentes.analiseEmFoco = true;

      try {
        this.erros.analiseEmFoco = null;

        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/analise`, params) as PsListAnaliseQualitativaDto;

        this.analiseEmFoco = resposta;
      } catch (erro: unknown) {
        this.erros.analiseEmFoco = erro;
      }
      this.chamadasPendentes.analiseEmFoco = false;
    },

    // eslint-disable-next-line max-len
    async salvarAnaliseDeCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params: ParametrosDeRequisicao): Promise<RespostaDeEnvio> {
      this.chamadasPendentes.analiseEmFoco = true;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/analise`, params) as RecordWithId;

        this.chamadasPendentes.analiseEmFoco = false;

        this.erros.analiseEmFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.analiseEmFoco = erro;
        this.chamadasPendentes.analiseEmFoco = false;
        return false;
      }
    },

    // eslint-disable-next-line max-len
    async buscarRiscoDoCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params = {}): Promise<void> {
      this.chamadasPendentes.riscoEmFoco = true;

      try {
        this.erros.riscoEmFoco = null;

        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/risco`, params) as PsListRiscoDto;

        this.riscoEmFoco = resposta;
      } catch (erro: unknown) {
        this.erros.riscoEmFoco = erro;
      }
      this.chamadasPendentes.riscoEmFoco = false;
    },

    // eslint-disable-next-line max-len
    async salvarRiscoDeCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params: ParametrosDeRequisicao): Promise<RespostaDeEnvio> {
      this.chamadasPendentes.riscoEmFoco = true;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/risco`, params) as RecordWithId;

        this.chamadasPendentes.riscoEmFoco = false;

        this.erros.riscoEmFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.riscoEmFoco = erro;
        this.chamadasPendentes.riscoEmFoco = false;
        return false;
      }
    },

    // eslint-disable-next-line max-len
    async buscarFechamentoDoCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params = {}): Promise<void> {
      this.chamadasPendentes.fechamentoEmFoco = true;

      try {
        this.erros.fechamentoEmFoco = null;

        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/fechamento`, params) as PsListFechamentoDto;

        this.fechamentoEmFoco = resposta;
      } catch (erro: unknown) {
        this.erros.fechamentoEmFoco = erro;
      }
      this.chamadasPendentes.fechamentoEmFoco = false;
    },

    // eslint-disable-next-line max-len
    async salvarFechamentoDeCiclo(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params: ParametrosDeRequisicao): Promise<RespostaDeEnvio> {
      this.chamadasPendentes.fechamentoEmFoco = true;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/fechamento`, params) as RecordWithId;

        this.chamadasPendentes.fechamentoEmFoco = false;

        this.erros.fechamentoEmFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.fechamentoEmFoco = erro;
        this.chamadasPendentes.fechamentoEmFoco = false;
        return false;
      }
    },

    // eslint-disable-next-line max-len
    async associarDocumentoComAnalise(pdmId: ChaveGenerica, cicloId: ChaveGenerica, params: ParametrosDeRequisicao): Promise<RespostaDeEnvio> {
      this.chamadasPendentes.documento = true;

      this.erros.documento = null;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/analise/documento`, params) as RecordWithId;

        this.chamadasPendentes.documento = false;

        return resposta;
      } catch (erro) {
        this.erros.documento = erro;
        this.chamadasPendentes.documento = false;
        return false;
      }
    },

    // eslint-disable-next-line max-len
    async desassociarDocumentoComAnalise(pdmId: ChaveGenerica, cicloId: ChaveGenerica, documentoId: ChaveGenerica): Promise<boolean> {
      this.chamadasPendentes.documento = true;
      this.erros.documento = null;

      try {
        await this.requestS.delete(`${baseUrl}/plano-setorial/${pdmId}/ciclo/${cicloId}/analise/documento/${documentoId}`);

        this.chamadasPendentes.documento = false;

        return true;
      } catch (erro) {
        this.erros.documento = erro;
        this.chamadasPendentes.documento = false;
        return false;
      }
    },
  },
  getters: {
    cicloAtivo: ({ listaDeCiclos }) => listaDeCiclos.find((ciclo) => ciclo.ativo),

    ciclosPorId: ({ listaDeCiclos }) => listaDeCiclos.reduce((acc, ciclo) => {
      acc[ciclo.id] = ciclo;
      return acc;
    }, {} as Record<number, CicloFisicoPSDto>),

    ciclosPorAno: ({ listaDeCiclos }) => listaDeCiclos.reduce((acc, ciclo) => {
      const ano = ciclo.data_ciclo.split('-')[0];

      if (!acc[ano]) {
        acc[ano] = [];
      }

      acc[ano].push(ciclo);
      return acc;
    }, {} as Record<string, CicloFisicoPSDto[]>),

    anoMaisRecente() {
      const anos = Object.keys(this.ciclosPorAno);

      const anoMaisRecente = Number(anos[anos.length - 1]);

      return Number.isNaN(anoMaisRecente)
        ? undefined
        : anoMaisRecente;
    },
  },
})();
