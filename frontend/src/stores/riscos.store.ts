import dateTimeToDate from '@/helpers/dateTimeToDate';
import type { ListProjetoRiscoDto, ProjetoRiscoDetailDto } from '@back/pp/risco/entities/risco.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoRiscoDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: ProjetoRiscoDetailDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
}

export const useRiscosStore = defineStore('riscos', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}, projetoId = 0): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco/${id}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}, projetoId = 0): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco`, params);

        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id: number, projetoId = 0): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0, projetoId = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco`, params);
        }

        this.chamadasPendentes.emFoco = false;
        this.erro = null;
        return resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      status: emFoco?.status_risco || null,
      tarefa_id: emFoco?.tarefas_afetadas?.map((x) => x.tarefa_id) || null,
      registrado_em: dateTimeToDate(emFoco?.registrado_em),
    }),

    riscosPorId: ({ lista }: Estado) => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
