/* eslint-disable import/no-extraneous-dependencies */
import { ListProjetoSeiDto, ProjetoDetailDto } from '@/../../backend/src/pp/projeto/entities/projeto.entity.ts';
import formatProcesso from '@/helpers/formatProcesso';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoSeiDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: ProjetoDetailDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
}

type MãeComId = {
  projetoId?: Number;
  obraId?: Number;
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

export const useContratosStore = defineStore('contratos', {
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
        const resposta = await this.requestS.get(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/sei/${id}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}, mãeComId: MãeComId = undefined): Promise<void> {
      console.log(this.route.params, mãeComId);
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto-mdo/${this.route.params.obraId}/contrato`, params);
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
        await this.requestS.delete(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/sei/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params:any = {}, id = 0, mãeComId: MãeComId = undefined): Promise<boolean> {
      console.log(mãeComId);
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;
        const paramsCopy = { ...params };
        paramsCopy.processos_sei = [paramsCopy.processos_sei];
        paramsCopy.fontes_recurso_ids = [Number(paramsCopy.fontes_recurso_ids)];
        console.log(paramsCopy);

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto-mdo/${this.route.params.obraId}/contrato`, paramsCopy);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto-mdo/${this.route.params.obraId}/contrato`, paramsCopy);
        }

        console.log(resposta);

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
      processo_sei: formatProcesso(emFoco?.processo_sei) || '',
    }),
  },
});
