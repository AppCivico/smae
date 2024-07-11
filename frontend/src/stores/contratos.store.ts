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
  emFoco: any | null;
  listaDeDependencias: {
    orgaos: any[];
    modalidades_de_contratacao: any[];
    status_de_contrato: any[];
    unidades_de_prazo: any[];
    processos_sei: any[];
    fontes_recurso: any[];
  };
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
    listaDeDependencias: {
      orgaos: [],
      modalidades_de_contratacao: [],
      status_de_contrato: [],
      unidades_de_prazo: [],
      processos_sei: [],
      fontes_recurso: [],
    },
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
  }),
  actions: {
    criaTodosOsStatusDeContratoDisponiveis() {
      return [
        { id: 'Assinado', nome: 'Assinado' },
        { id: 'Vigente', nome: 'Vigente' },
        { id: 'Suspenso', nome: 'Suspenso' },
        { id: 'Rescindido', nome: 'Rescindido' },
        { id: 'ConcluidoTermoRecebimentoProvisorio', nome: 'Concluído Termo de Recebimento Provisório' },
        { id: 'ConcluidoTermoRecebimentoDefinitivo', nome: 'Concluído Termo de Recebimento Definitivo' },
      ];
    },
    criaTodasAsUnidadesDePrazo() {
      return [
        { id: 'Dias', nome: 'Dias' },
        { id: 'Meses', nome: 'Meses' },
      ];
    },
    async buscarDependencias() {
      const obra = await this.requestS.get(`${baseUrl}/projeto-mdo/${this.route.params.obraId}`);
      const processosSei = await this.requestS.get(`${baseUrl}/projeto-mdo/${this.route.params.obraId}/sei`);
      const orgaos = await this.requestS.get(`${baseUrl}/orgao`);
      const modalidadesContratacao = await this.requestS.get(`${baseUrl}/modalidade-contratacao-mdo`);
      this.listaDeDependencias.processos_sei = processosSei.linhas.map((processoSei: any) => {
        const processoSeiLocal = processoSei;
        processoSeiLocal.id = processoSei.id.toString();
        return processoSeiLocal;
      });
      this.listaDeDependencias.fontes_recurso = obra.fonte_recursos;
      this.listaDeDependencias.orgaos = orgaos.linhas;
      this.listaDeDependencias.modalidades_de_contratacao = modalidadesContratacao.linhas;
      this.listaDeDependencias.status_de_contrato = this.criaTodosOsStatusDeContratoDisponiveis();
      this.listaDeDependencias.unidades_de_prazo = this.criaTodasAsUnidadesDePrazo();
    },

    async buscarItem(id = 0, params = {}, mãeComId: MãeComId = undefined): Promise<void> {
      console.log(mãeComId);
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/projeto-mdo/${this.route.params.obraId}/contrato/${id}`, params);
        if (resposta.orgao) {
          resposta.orgao_id = resposta.orgao.id;
        }
        console.log('RESPONSE', resposta);
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
      console.log(mãeComId);
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/projeto-mdo/${this.route.params.obraId}/contrato/${id}`);

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
        console.log('PAYLOAD', params);
        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto-mdo/${this.route.params.obraId}/contrato/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto-mdo/${this.route.params.obraId}/contrato`, params);
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
    }),
  },
});
