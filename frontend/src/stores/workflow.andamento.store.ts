/* eslint-disable import/no-extraneous-dependencies */
import { WorkflowAndamentoDto } from '@/../../backend/src/workflow/andamento/entities/workflow-andamento.entity';
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
    async encerrarFase(params = {}): Promise<boolean> {
      this.chamadasPendentes.fase = true;

      try {
        const resposta = await this.requestS.patch(`${baseUrl}/workflow-andamento-fase/finalizar`, {
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
    async editarTarefas(params = {}): Promise<boolean> {
      this.chamadasPendentes.tarefas = true;

      try {
        const resposta = await this.requestS.patch(`${baseUrl}/workflow-andamento-tarefas`, {
          transferencia_id: Number(this.route.params.transferenciaId) || undefined,
          ...params,
        });

        this.chamadasPendentes.tarefas = false;
        this.erro = null;
        return !!resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.tarefas = false;
        return false;
      }
    },
  },
});
