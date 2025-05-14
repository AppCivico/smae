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

type MãeComId = {
  projetoId?: number;
  obraId?: number;
} | undefined;

function gerarCaminhoParaApi(mãeComId: MãeComId): string | null {
  switch (true) {
    case !!mãeComId?.projetoId:
      return `projeto/${mãeComId?.projetoId}`;

    case !!mãeComId?.obraId:
      return `projeto-mdo/${mãeComId?.obraId}`;

    default:
      console.error('Id identificado da entidade mãe não foi provido como esperado', mãeComId);
      throw new Error('Id identificado da entidade mãe não foi provido como esperado');
  }
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
    async buscarItem(id = 0, params = {}, mãeComId: MãeComId = undefined): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/acompanhamento/${id}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}, mãeComId: MãeComId = undefined): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/acompanhamento`, params);

        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id: number, mãeComId: MãeComId = undefined): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/acompanhamento/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0, mãeComId: MãeComId = undefined): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/acompanhamento/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/acompanhamento`, params);
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
