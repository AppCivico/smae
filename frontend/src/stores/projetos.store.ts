import { defineStore } from 'pinia';
import { PaginatedWithPagesDto } from '@back/common/dto/paginated.dto';
import type {
  DadosCodTituloMetaDto,
  ListDadosMetaIniciativaAtividadesDto,
} from '@back/meta/dto/create-meta.dto';
import type { ProjetoAcao } from '@back/pp/projeto/acao/dto/acao.dto';
import type {
  ListProjetoDocumento,
  ListProjetoDto,
  ProjetoDetailDto,
  ProjetoDto,
  ProjetoMdoDto,
} from '@back/pp/projeto/entities/projeto.entity';
import type {
  ListProjetoProxyPdmMetaDto,
  ProjetoProxyPdmMetaDto,
} from '@back/pp/projeto/entities/projeto.proxy-pdm-meta.entity';
import type { DiretorioItemDto } from '@back/upload/dto/diretorio.dto';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import mapIniciativas from './helpers/mapIniciativas';
import consolidarDiretorios from '@/helpers/consolidarDiretorios';
import simplificadorDeOrigem from '@/helpers/simplificadorDeOrigem';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoDto['linhas'];
type PdmsSimplificados = ListProjetoProxyPdmMetaDto['linhas'];
type MetaSimplificada = ListDadosMetaIniciativaAtividadesDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  listaV2: boolean;
  emFoco: boolean;
  pdmsSimplificados: boolean;
  metaSimplificada: boolean;
  arvoreDeMetas: boolean;
  mudarStatus: boolean;
  transferirDePortfolio: boolean;
  arquivos: boolean;
  diretórios: boolean;
}

interface Estado {
  ultimoVisitado: number | null;
  lista: Lista;
  listaV2: PaginatedWithPagesDto<ProjetoMdoDto>['linhas'];
  paginacaoProjetos: {
    tokenPaginacao: string | null;
    paginas: number;
    paginaCorrente: number;
    temMais: boolean;
    totalRegistros: number;
  };
  emFoco: ProjetoDetailDto | null;
  arquivos: ListProjetoDocumento['linhas'] | [];
  diretórios: DiretorioItemDto[];

  chamadasPendentes: ChamadasPendentes;

  pdmsSimplificados: PdmsSimplificados;
  arvoreDeMetas: { [k: number]: unknown };
  metaSimplificada: MetaSimplificada;
  erro: null | unknown;
  erros: {
    arvoreDeMetas: unknown;
  };
}

export const useProjetosStore = defineStore('projetos', {
  state: (): Estado => ({
    ultimoVisitado: Number(sessionStorage.getItem('projetos.ultimoVisitado')) || null,
    lista: [],
    listaV2: [],
    paginacaoProjetos: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: true,
      totalRegistros: 0,
    },
    emFoco: null,
    arquivos: [],
    diretórios: [],

    chamadasPendentes: {
      lista: false,
      listaV2: false,
      emFoco: false,
      pdmsSimplificados: false,
      metaSimplificada: false,
      arvoreDeMetas: false,
      mudarStatus: false,
      transferirDePortfolio: false,
      arquivos: false,
      diretórios: true,
    },

    arvoreDeMetas: {},
    pdmsSimplificados: [],
    metaSimplificada: [],
    erro: null,
    erros: {
      arvoreDeMetas: null,
    },
  }),
  actions: {
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/projeto/${id}`, params);
        this.emFoco = resposta;
        sessionStorage.setItem('projetos.ultimoVisitado', this.emFoco.id);
      } catch (erro: unknown) {
        this.erro = erro;
      }

      this.chamadasPendentes.emFoco = false;
    },

    async buscarPdms(params = {}): Promise<void> {
      this.chamadasPendentes.pdmsSimplificados = true;
      this.pdmsSimplificados = [];
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/proxy/pdm-e-metas`, params);
        this.pdmsSimplificados = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.pdmsSimplificados = false;
    },

    // Obsoleta! Substituir por `buscarArvoreDeMetas()`
    async buscarMetaSimplificada(params = {}): Promise<void> {
      this.chamadasPendentes.metaSimplificada = true;
      this.metaSimplificada = [];
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/proxy/iniciativas-atividades`, params);
        [this.metaSimplificada] = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.metaSimplificada = false;
    },

    async buscarArvoreDeMetas(params = {}): Promise<void> {
      this.chamadasPendentes.arvoreDeMetas = true;
      this.erros.arvoreDeMetas = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/proxy/iniciativas-atividades`, params);

        if (Array.isArray(linhas)) {
          linhas.forEach((cur:DadosCodTituloMetaDto) => {
            this.arvoreDeMetas[cur.id] = {
              ...cur,
              iniciativas: mapIniciativas(cur.iniciativas),
            };
          });
        }
      } catch (erro: unknown) {
        this.erros.arvoreDeMetas = erro;
      }
      this.chamadasPendentes.arvoreDeMetas = false;
    },

    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto`, params);

        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudoV2(params = {}): Promise<void> {
      this.listaV2 = [];
      this.chamadasPendentes.listaV2 = true;
      this.chamadasPendentes.emFoco = true;

      try {
        const { linhas, ...paginacao } = (await this.requestS.get(
          `${baseUrl}/projeto/v2`,
          params,
        )) as PaginatedWithPagesDto<ProjetoMdoDto>;

        this.paginacaoProjetos = {
          tokenPaginacao: paginacao.token_paginacao,
          paginas: paginacao.paginas,
          paginaCorrente: paginacao.pagina_corrente,
          temMais: paginacao.tem_mais,
          totalRegistros: paginacao.total_registros,
        };

        this.listaV2 = linhas;

        sessionStorage.removeItem('projetos.ultimoVisitado');
        this.ultimoVisitado = null;
      } catch (erro: unknown) {
        this.erro = erro;
      } finally {
        this.chamadasPendentes.listaV2 = false;
        this.chamadasPendentes.emFoco = true;
      }
    },

    // Obsoleta
    async buscarDiretórios(idDoProjeto = 0): Promise<void> {
      this.chamadasPendentes.diretórios = true;
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/diretorio`, { projeto_id: idDoProjeto || this.route.params.projetoId });

        this.diretórios = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }

      this.chamadasPendentes.diretórios = false;
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;
      this.erro = null;

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

    async mudarStatus(id: number, ação: ProjetoAcao): Promise<boolean> {
      this.chamadasPendentes.mudarStatus = true;
      this.erro = null;

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

    async revisar(projetoId: string, status: boolean): Promise<void> {
      try {
        await this.requestS.post(`${baseUrl}/projeto/revisar`, {
          obras: [
            {
              projeto_id: projetoId,
              revisado: status,
            },
          ],
        });
      } catch (erro) {
        this.erro = erro;
      }
    },

    async revisarTodos(): Promise<void> {
      try {
        await this.requestS.post(`${baseUrl}/projeto/revisar-todas`, {});
      } catch (erro) {
        this.erro = erro;
      }
    },

    async transferirDePortfolio(idDoProjeto: number, idDoPortfolio: number): Promise<boolean> {
      this.chamadasPendentes.transferirDePortfolio = true;
      this.erro = null;

      try {
        if (!(idDoProjeto > 0)) {
          throw new Error(`ID do projeto inválido: \`${idDoProjeto}\``);
        }
        if (!(idDoPortfolio > 0)) {
          throw new Error(`ID do portfolio inválido: \`${idDoPortfolio}\``);
        }

        await this.requestS.post(`${baseUrl}/projeto/${idDoProjeto}/transferir-portfolio`, { portfolio_id: idDoPortfolio });

        this.chamadasPendentes.transferirDePortfolio = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.transferirDePortfolio = false;

        return false;
      }
    },

    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async buscarArquivos(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.arquivos = true;
      this.erro = null;

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

    async excluirArquivo(id: number, idDoProjeto = 0): Promise<boolean> {
      this.chamadasPendentes.arquivos = true;
      this.erro = null;

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
      this.erro = null;

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
    itemParaEdicao: ({ emFoco, route }) => ({
      ...emFoco,
      portfolio_id: emFoco?.portfolio_id || route.query.portfolio_id,
      data_aprovacao: dateTimeToDate(emFoco?.data_aprovacao),
      data_revisao: dateTimeToDate(emFoco?.data_revisao),
      equipe: emFoco?.equipe.map((x) => x.pessoa.id) || [],
      fonte_recursos: emFoco?.fonte_recursos || null,
      geolocalizacao: emFoco?.geolocalizacao?.map((x) => x.token) || [],
      meta_codigo: emFoco?.meta_codigo || '',
      orgao_gestor_id: emFoco?.orgao_gestor?.id || null,
      origem_outro: emFoco?.origem_outro || '',
      origens_extra: Array.isArray(emFoco?.origens_extra)
        ? emFoco.origens_extra.map((origem) => simplificadorDeOrigem(origem, { origem_tipo: 'PdmSistema' }))
        : [],
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

    geolocalizaçãoPorToken: ({ emFoco }) => (Array.isArray(emFoco?.geolocalizacao)
      ? emFoco?.geolocalizacao.reduce((acc, cur) => {
        acc[cur.token] = cur;
        return acc;
      }, {} as { [key: string]: any })
      : {}),

    arquivosPorId: ({ arquivos }: Estado) => arquivos
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    pdmsPorId: ({ pdmsSimplificados }: Estado) => pdmsSimplificados
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    planosAgrupadosPorTipo: ({ pdmsSimplificados }) => {
      const grupos = pdmsSimplificados.reduce((acc, cur) => {
        if (!acc[cur.tipo]) {
          acc[cur.tipo] = [];
        }
        acc[cur.tipo].push(cur);
        return acc;
      }, {} as { [key: string]: ProjetoProxyPdmMetaDto[] });

      const chaves = Object.keys(grupos).sort((a, b) => a.localeCompare(b));
      let i = 0;
      const resultado: { [key: string]: ProjetoProxyPdmMetaDto[] } = {};

      while (i < chaves.length) {
        const chave = chaves[i];
        resultado[chave] = grupos[chave]
          .sort((a:ProjetoProxyPdmMetaDto, b:ProjetoProxyPdmMetaDto) => a.nome
            .localeCompare(b.nome));
        i += 1;
      }

      return resultado;
    },

    projetosPorId: ({ lista }: Estado) => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    permissõesDoProjetoEmFoco: ({ emFoco }: Estado) => (typeof emFoco?.permissoes === 'object'
      ? emFoco.permissoes
      : {}),

    pdmsSimplificadosPorTipo: ({ pdmsSimplificados }: Estado) => pdmsSimplificados
      .reduce((acc, cur) => {
        if (!acc[cur.tipo]) {
          acc[cur.tipo] = [];
        }
        acc[cur.tipo].push(cur);
        return acc;
      }, {} as { [key: string]: ProjetoProxyPdmMetaDto[] }),

    projetosPorPortfolio: ({ lista }: Estado): { [k: number | string]: ProjetoDto[] } => lista
      .reduce((acc, cur: ProjetoDto) => {
        if (!acc[cur.portfolio.id]) {
          acc[cur.portfolio.id] = [];
        }
        acc[cur.portfolio.id].push(cur);
        return acc;
      }, {} as { [key: string]: ProjetoDto[] }),

    projetosPortfolioModeloClonagem: ({ lista }: Estado): ProjetoDto[] => lista
      .filter((e) => e.portfolio.modelo_clonagem == true),

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

    diretóriosConsolidados: ({ arquivos, diretórios }): string[] => consolidarDiretorios(
      arquivos,
      diretórios,
    ),
  },
});
