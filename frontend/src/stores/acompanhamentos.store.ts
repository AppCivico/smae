/* eslint-disable import/no-extraneous-dependencies */
import type { DetailProjetoAcompanhamentoDto, ListProjetoAcompanhamentoDto, RiscoIdCod } from '@/../../backend/src/pp/acompanhamento/entities/acompanhamento.entity';

import dateTimeToDate from '@/helpers/dateTimeToDate';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoAcompanhamentoDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: DetailProjetoAcompanhamentoDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
}

export const useAcompanhamentosStore = defineStore('acompanhamentos', {
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
        const resposta = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/acompanhamento/${id}`, params);
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
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/acompanhamento`, params);

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
        await this.requestS.delete(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/acompanhamento/${id}`);

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
          resposta = await this.requestS.patch(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/acompanhamento/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/acompanhamento`, params);
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
    itemParaEdição: ({ emFoco }) => ({
      ...emFoco,
      data_registro: dateTimeToDate(emFoco?.data_registro) || null,
      risco: emFoco?.risco?.map((x: RiscoIdCod) => x.id) || null,
      acompanhamento_tipo_id: emFoco?.acompanhamento_tipo?.id || null,
      acompanhamentos: !Array.isArray(emFoco?.acompanhamentos)
        ? null
        : emFoco?.acompanhamentos.map((x) => ({
          ...x,
          prazo_encaminhamento: dateTimeToDate(x.prazo_encaminhamento) || null,
          prazo_realizado: dateTimeToDate(x.prazo_realizado) || null,
        })) || null,
    }),
  },
});
