/* eslint-disable import/no-extraneous-dependencies */
import { defineStore } from 'pinia';
import type {
  WorkflowAndamentoDto, WorkflowAndamentoFasesDto, WorkflowAndamentoFluxoDto, TransferenciaHistoricoDto,
} from '@/../../backend/src/workflow/andamento/entities/workflow-andamento.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface ChamadasPendentes {
  workflow: boolean;
  fase: boolean;
  tarefas: boolean;
  historico: boolean;
}

interface Estado {
  workflow: WorkflowAndamentoDto | null;
  chamadasPendentes: ChamadasPendentes;
  historico: TransferenciaHistoricoDto | null;
  erro: null | unknown;
}

export const useWorkflowAndamentoStore = defineStore('workflowAndamento', {
  state: (): Estado => ({
    workflow: null,
    historico: null,
    chamadasPendentes: {
      workflow: false,
      fase: false,
      tarefas: false,
      historico: false,
    },
    erro: null,
  }),
  actions: {
    async buscar(params = {}): Promise<void> {
      this.chamadasPendentes.workflow = true;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/workflow-andamento/`, {
          transferencia_id: Number(this.route.params.transferenciaId) || undefined,
          ...params,
        });

        if (typeof resposta === 'object') {
          this.workflow = resposta;
        }
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.workflow = false;
    },

    async buscarHistorico(transferênciaId?: number): Promise<void> {
      this.chamadasPendentes.historico = true;
      const id = transferênciaId || Number(this.route.params.transferenciaId);
      try {
        const resposta = await this.requestS.get(`${baseUrl}/transferencia/${id}/historico`, {
          id,
        });

        if (typeof resposta === 'object') {
          this.historico = resposta;
        }
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.historico = false;
    },

    async editarFase(params = {}): Promise<boolean> {
      this.chamadasPendentes.fase = true;

      try {
        const resposta = await this.requestS.patch(`${baseUrl}/workflow-andamento-fase`, {
          transferencia_id: Number(this.route.params.transferenciaId) || undefined,
          ...params,
        });

        this.chamadasPendentes.fase = false;
        this.erro = null;
        return !!resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.fase = false;
        return false;
      }
    },

    async reabrirFase(transferênciaId?: number): Promise<boolean> {
      try {
        const resposta = await this.requestS.post(`${baseUrl}/workflow-andamento-fase/reabrir-fase-anterior`, {
          transferencia_id: transferênciaId || Number(this.route.params.transferenciaId),
        });

        this.chamadasPendentes.fase = false;
        this.erro = null;
        return !!resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.fase = false;
        return false;
      }
    },

    async deletarWorklow(transferênciaId?: number): Promise<boolean> {
      const id = transferênciaId || Number(this.route.params.transferenciaId);
      try {
        const resposta = await this.requestS.patch(`${baseUrl}/transferencia/${id}/limpar-workflow`, {
          id,
        });
        this.erro = null;
        return !!resposta;
      } catch (erro) {
        this.erro = erro;
        return false;
      }
    },

    async iniciarFase(faseId: number, transferênciaId: number): Promise<boolean> {
      this.chamadasPendentes.fase = true;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/workflow-andamento-fase/iniciar`, {
          transferencia_id: transferênciaId || Number(this.route.params.transferenciaId),
          fase_id: faseId,
        });

        this.chamadasPendentes.fase = false;
        this.erro = null;
        return !!resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.fase = false;
        return false;
      }
    },

    async encerrarFase(faseId: number, transferênciaId: number): Promise<boolean> {
      this.chamadasPendentes.fase = true;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/workflow-andamento-fase/finalizar`, {
          transferencia_id: transferênciaId || Number(this.route.params.transferenciaId),
          fase_id: faseId,
        });

        this.chamadasPendentes.fase = false;
        this.erro = null;
        return !!resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.fase = false;
        return false;
      }
    },

    async avançarEtapa(transferênciaId: number): Promise<boolean> {
      this.chamadasPendentes.fase = true;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/workflow-andamento/iniciar-prox-etapa`, {
          transferencia_id: transferênciaId || Number(this.route.params.transferenciaId),
        });

        this.chamadasPendentes.fase = false;
        this.erro = null;
        return !!resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.fase = false;
        return false;
      }
    },
  },

  getters: {
    etapaCorrente: ({ workflow }): WorkflowAndamentoFluxoDto | null => workflow?.fluxo?.[0] || null,

    inícioDeFasePermitido() {
      return this.etapaCorrente?.fases?.some((
        x: WorkflowAndamentoFasesDto,
        i: number,
        lista: WorkflowAndamentoFasesDto[],
      ) => x.andamento?.concluida && lista[i + 1]?.andamento?.data_inicio === null)
      || false;
    },

    idDaPróximaFasePendente() {
      // eslint-disable-next-line max-len
      return this.etapaCorrente?.fases?.find((x: WorkflowAndamentoFasesDto) => x.andamento?.data_inicio === null)?.fase?.id
       || 0;
    },
  },
});
