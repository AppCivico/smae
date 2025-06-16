import dateTimeToDate from '@/helpers/dateTimeToDate';
import formatProcesso from '@/helpers/formatProcesso';
import type { ContratoAditivoItemDto } from '@back/pp/contrato-aditivo/entities/contrato-aditivo.entity';
import type { ContratoDetailDto } from '@back/pp/contrato/entities/contrato.entity';
import type { ListProjetoSeiDto } from '@back/pp/projeto/entities/projeto.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoSeiDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  aditivo: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: ContratoDetailDto | null;
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
      console.error('Id identificador não foi provido como esperado', mãeComId);
      throw new Error('Id identificador não foi provido como esperado');
  }
}

function gerarCaminhoParaApiAditivo(mãeComId: MãeComId): string | null {
  switch (true) {
    case !!mãeComId?.projetoId:
      return 'contrato-pp';

    case !!mãeComId?.obraId:
      return 'contrato-mdo';

    default:
      throw new Error('Id identificador não foi provido como esperado');
  }
}

export const useContratosStore = (prefixo: string) => defineStore(prefixo ? `${prefixo}.contratos` : 'contratos', {
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
      aditivo: false,
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
    async buscarDependencias(mãeComId: MãeComId = undefined) {
      this.chamadasPendentes.emFoco = true;
      const obra = await this.requestS.get(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}`);
      const processosSei = await this.requestS.get(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/sei`);
      const orgaos = await this.requestS.get(`${baseUrl}/orgao`);
      const modalidadesContratacao = await this.requestS.get(`${baseUrl}/modalidade-contratacao-mdo`);
      this.listaDeDependencias.processos_sei = processosSei.linhas.map((processoSei: any) => {
        const processoSeiLocal = processoSei;
        processoSeiLocal.id = processoSei.processo_sei;
        processoSeiLocal.processo_sei = formatProcesso(processoSei.processo_sei);
        return processoSeiLocal;
      });
      this.listaDeDependencias.fontes_recurso = obra.fonte_recursos;
      this.listaDeDependencias.orgaos = orgaos.linhas;
      this.listaDeDependencias.modalidades_de_contratacao = modalidadesContratacao.linhas;
      this.listaDeDependencias.status_de_contrato = this.criaTodosOsStatusDeContratoDisponiveis();
      this.listaDeDependencias.unidades_de_prazo = this.criaTodasAsUnidadesDePrazo();
      this.chamadasPendentes.emFoco = false;
    },

    async buscarItem(id = 0, params = {}, mãeComId: MãeComId = undefined): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/contrato/${id}`, params);
        if (resposta.orgao) {
          resposta.orgao_id = resposta.orgao.id;
        }
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
        const { linhas } = await this.requestS.get(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/contrato`, params);
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
        await this.requestS.delete(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/contrato/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params: any = {}, id = 0, mãeComId: MãeComId = undefined): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;
        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/contrato/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/${gerarCaminhoParaApi(mãeComId || this.route.params)}/contrato`, params);
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
    async salvarAditivo(
      carga: any = {},
      idDoAditivo = 0,
      idDoContrato = 0,
      mãeComId: MãeComId = undefined,
    ): Promise<boolean> {
      this.chamadasPendentes.aditivo = true;
      this.erro = null;

      try {
        if (idDoAditivo) {
          await this.requestS.patch(`${baseUrl}/${gerarCaminhoParaApiAditivo(mãeComId || this.route.params)}/${idDoContrato || this.route.params.contratoId}/aditivo/${idDoAditivo}`, carga);
        } else {
          await this.requestS.post(`${baseUrl}/${gerarCaminhoParaApiAditivo(mãeComId || this.route.params)}/${idDoContrato || this.route.params.contratoId}/aditivo`, carga);
        }

        this.chamadasPendentes.aditivo = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.aditivo = false;
        return false;
      }
    },
    async excluirAditivo(
      idDoAditivo: number,
      idDoContrato = 0,
      mãeComId: MãeComId = undefined,
    ): Promise<boolean> {
      this.chamadasPendentes.aditivo = true;

      try {
        await this.requestS.delete(`${baseUrl}/${gerarCaminhoParaApiAditivo(mãeComId || this.route.params)}/${idDoContrato || this.route.params.contratoId}/aditivo/${idDoAditivo}`);
        this.chamadasPendentes.aditivo = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.aditivo = false;
        return false;
      }
    },
  },
  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      data_assinatura: emFoco?.data_assinatura
        ? dateTimeToDate(emFoco?.data_assinatura)
        : null,
      data_inicio: emFoco?.data_inicio
        ? dateTimeToDate(emFoco?.data_inicio)
        : null,
      data_termino: emFoco?.data_termino
        ? dateTimeToDate(emFoco?.data_termino)
        : null,
      fontes_recurso: emFoco?.fontes_recurso || [],
      modalidade_contratacao_id: emFoco?.modalidade_contratacao?.id,
      orgao_id: emFoco?.orgao?.id,
    }),
    aditivosPorId: ({ emFoco }) => emFoco?.aditivos?.reduce((acc, cur: ContratoAditivoItemDto) => {
      acc[cur.id] = cur;
      return acc;
    }, {}),
  },
})();
