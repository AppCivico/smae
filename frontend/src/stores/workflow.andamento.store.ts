/* eslint-disable import/no-extraneous-dependencies */
import { WorkflowAndamentoDto, WorkflowAndamentoFasesDto, WorkflowAndamentoFluxoDto } from '@/../../backend/src/workflow/andamento/entities/workflow-andamento.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface ChamadasPendentes {
  workflow: boolean;
  fase: boolean;
  tarefas: boolean;
}

interface Estado {
  workflow: WorkflowAndamentoDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
}

export const useWorkflowAndamentoStore = defineStore('workflowAndamento', {
  state: (): Estado => ({
    workflow: null,

    chamadasPendentes: {
      workflow: false,
      fase: false,
      tarefas: false,
    },
    erro: null,
  }),
  actions: {
    async buscar(params = {}): Promise<void> {
      this.chamadasPendentes.workflow = true;
      await new Promise((resolve) => { setTimeout(resolve, 5000); });
      try {
        const resposta = await this.requestS.get(`${baseUrl}/workflow-andamento/`, {
          transferencia_id: Number(this.route.params.transferenciaId) || undefined,
          ...params,
        });
        this.workflow = resposta;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.workflow = false;
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

    async iniciarFase(faseId: Number, transferênciaId: Number): Promise<boolean> {
      this.chamadasPendentes.fase = true;
      await new Promise((resolve) => { setTimeout(resolve, 5000); });

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

    async encerrarFase(faseId: Number, transferênciaId: Number): Promise<boolean> {
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

    async avançarEtapa(transferênciaId: Number): Promise<boolean> {
      this.chamadasPendentes.fase = true;
      await new Promise((resolve) => { setTimeout(resolve, 5000); });

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
      return this.etapaCorrente?.fases?.some((x: WorkflowAndamentoFasesDto) => x.andamento === null)
      || false;
    },

    avançoDeEtapaPermitido() {
      // eslint-disable-next-line max-len
      return !this.etapaCorrente?.fases?.some((x: WorkflowAndamentoFasesDto) => !x.andamento?.concluida)
      || false;
    },

    idDaPróximaFasePendente() {
      // eslint-disable-next-line max-len
      return this.etapaCorrente?.fases?.find((x: WorkflowAndamentoFasesDto) => x.andamento === null)?.fase?.id
       || 0;
    },
  },
});
