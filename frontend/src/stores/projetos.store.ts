/* eslint-disable import/no-extraneous-dependencies */
import { ListDadosMetaIniciativaAtividadesDto } from '@/../../backend/src/meta/dto/create-meta.dto';
import { ProjetoAcao } from '@/../../backend/src/pp/projeto/acao/dto/acao.dto';
import {
  ListProjetoDocumento,
  ListProjetoDto,
  ProjetoDetailDto,
  ProjetoDto,
  ProjetoPermissoesDto,
} from '@/../../backend/src/pp/projeto/entities/projeto.entity';
import { ListProjetoProxyPdmMetaDto } from '@/../../backend/src/pp/projeto/entities/projeto.proxy-pdm-meta.entity';
import { DiretorioItemDto } from '@/../../backend/src/upload/dto/diretorio.dto';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoDto['linhas'];
type PdmsSimplificados = ListProjetoProxyPdmMetaDto['linhas'];
type MetaSimplificada = ListDadosMetaIniciativaAtividadesDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  pdmsSimplificados: boolean;
  metaSimplificada: boolean;
  mudarStatus: boolean;
  arquivos: boolean;
  diretórios: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: ProjetoDetailDto | null;
  arquivos: ListProjetoDocumento['linhas'] | [];
  diretórios: DiretorioItemDto[];

  chamadasPendentes: ChamadasPendentes;

  pdmsSimplificados: PdmsSimplificados;
  metaSimplificada: MetaSimplificada;
  erro: null | unknown;
}

export const useProjetosStore = defineStore('projetos', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    arquivos: [],
    diretórios: [],

    chamadasPendentes: {
      lista: true,
      emFoco: true,
      pdmsSimplificados: false,
      metaSimplificada: false,
      mudarStatus: false,
      arquivos: false,
      diretórios: true,
    },

    pdmsSimplificados: [],
    metaSimplificada: [],
    erro: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/projeto/${id}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarPdms(params = {}): Promise<void> {
      this.chamadasPendentes.pdmsSimplificados = true;
      this.pdmsSimplificados = [];

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/proxy/pdm-e-metas`, params);
        this.pdmsSimplificados = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.pdmsSimplificados = false;
    },

    async buscarMetaSimplificada(params = {}): Promise<void> {
      this.chamadasPendentes.metaSimplificada = true;
      this.metaSimplificada = [];

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/proxy/iniciativas-atividades`, params);
        [this.metaSimplificada] = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.metaSimplificada = false;
    },

    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto`, params);

        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async buscarDiretórios(idDoProjeto = 0): Promise<void> {
      this.chamadasPendentes.diretórios = true;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/diretorio`, { projeto_id: idDoProjeto || this.route.params.projetoId });

        this.diretórios = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }

      this.chamadasPendentes.diretórios = false;
    },

    async excluirItem(id: Number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/projeto/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async mudarStatus(id: Number, ação: ProjetoAcao): Promise<boolean> {
      this.chamadasPendentes.mudarStatus = true;

      try {
        await this.requestS.patch(`${baseUrl}/projeto-acao`, { acao: ação, projeto_id: id });

        this.chamadasPendentes.mudarStatus = false;

        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.mudarStatus = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto`, params);
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

    async buscarArquivos(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.arquivos = true;

      try {
        const resposta: ListProjetoDocumento = await this.requestS.get(`${baseUrl}/projeto/${id || this.route.params.projetoId}/documento`, params);

        if (Array.isArray(resposta.linhas)) {
          this.arquivos = resposta.linhas;
        }
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.arquivos = false;
    },

    async excluirArquivo(id: Number, idDoProjeto = 0): Promise<boolean> {
      this.chamadasPendentes.arquivos = true;

      try {
        await this.requestS.delete(`${baseUrl}/projeto/${idDoProjeto || this.route.params.projetoId}/documento/${id}`);

        this.arquivos = this.arquivos.filter((x) => x.id !== id);
        this.chamadasPendentes.arquivos = false;

        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.arquivos = false;
        return false;
      }
    },

    async associarArquivo(params = {}, id = 0, idDoProjeto = 0): Promise<boolean> {
      this.chamadasPendentes.arquivos = true;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto/${idDoProjeto || this.route.params.projetoId}/documento/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto/${idDoProjeto || this.route.params.projetoId}/documento`, params);
        }

        this.chamadasPendentes.arquivos = false;
        return resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.arquivos = false;
        return false;
      }
    },
  },
  getters: {
    itemParaEdição: ({ emFoco, route }) => ({
      ...emFoco,
      portfolio_id: emFoco?.portfolio_id || route.query.portfolio_id,
      data_aprovacao: dateTimeToDate(emFoco?.data_aprovacao),
      data_revisao: dateTimeToDate(emFoco?.data_revisao),
      equipe: emFoco?.equipe.map((x) => x.pessoa.id) || [],
      meta_codigo: emFoco?.meta_codigo || '',
      orgao_gestor_id: emFoco?.orgao_gestor?.id || null,
      origem_outro: emFoco?.origem_outro || '',
      pdm_escolhido: emFoco?.meta?.pdm_id || null,
      portfolios_compartilhados: emFoco?.portfolios_compartilhados?.map((x) => x.id) || null,
      previsao_custo: emFoco?.previsao_custo || 0,
      previsao_inicio: dateTimeToDate(emFoco?.previsao_inicio) || null,
      previsao_termino: dateTimeToDate(emFoco?.previsao_termino) || null,
      principais_etapas: emFoco?.principais_etapas || '',
      realizado_inicio: dateTimeToDate(emFoco?.realizado_inicio),
      realizado_termino: dateTimeToDate(emFoco?.realizado_termino),
      regiao_id: emFoco?.regiao?.id || null,
      responsavel_id: emFoco?.responsavel?.id || null,
      resumo: emFoco?.resumo || '',
      orgaos_participantes: emFoco?.orgaos_participantes?.map((x) => x.id) || null,
      orgao_responsavel_id: emFoco?.orgao_responsavel?.id || null,
      // eslint-disable-next-line max-len
      responsaveis_no_orgao_gestor: emFoco?.responsaveis_no_orgao_gestor?.map((x) => x.id) || null,
    }),

    arquivosPorId: ({ arquivos }: Estado) => arquivos
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    pdmsPorId: ({ pdmsSimplificados }: Estado) => pdmsSimplificados
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    projetosPorId: ({ lista }: Estado) => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    permissõesDoProjetoEmFoco: ({ emFoco }: Estado) => (typeof emFoco?.permissoes === 'object'
      ? emFoco.permissoes
      : {}),

    projetosPorPortfolio: ({ lista }: Estado): { [k: number | string]: ProjetoDto[] } => lista
      .reduce((acc: any, cur: ProjetoDto) => {
        if (!acc[cur.portfolio.id]) {
          acc[cur.portfolio.id] = [];
        }
        acc[cur.portfolio.id].push(cur);
        return acc;
      }, {}),

    órgãosEnvolvidosNoProjetoEmFoco: ({ emFoco }) => {
      const órgãos = emFoco?.orgaos_participantes && Array.isArray(emFoco?.orgaos_participantes)
        ? [...emFoco.orgaos_participantes]
        : [];

      if (emFoco?.orgao_responsavel?.id) {
        if (órgãos.findIndex((x) => x.id === emFoco?.orgao_responsavel?.id) === -1) {
          órgãos?.push(emFoco?.orgao_responsavel);
        }
      }

      return órgãos;
    },

    diretóriosConsolidados: ({ diretórios, arquivos }): string[] => arquivos
      .reduce((acc: DiretorioItemDto['caminho'][], cur) => {
        const caminho = cur.arquivo.diretorio_caminho || '/';
        return acc.indexOf(caminho) === -1
          ? acc.concat([caminho])
          : acc;
      }, diretórios.map((x) => x.caminho))
      .sort((a, b) => a.localeCompare(b)),
  },
});
