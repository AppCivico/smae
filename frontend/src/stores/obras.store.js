import { defineStore } from 'pinia';
import consolidarDiretorios from '@/helpers/consolidarDiretorios';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import simplificadorDeOrigem from '@/helpers/simplificadorDeOrigem';
import mapIniciativas from './helpers/mapIniciativas';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useObrasStore = defineStore('obrasStore', {
  state: () => ({
    ultimoVistoId: sessionStorage.getItem('obras.ultimoVistoId') || null,
    lista: [],
    totalRegistrosRevisados: 0,
    emFoco: null,
    arquivos: [],
    listaDeTodosIds: [],

    pdmsSimplificados: [],
    metaSimplificada: [],
    arvoreDeMetas: {},

    chamadasPendentes: {
      lista: false,
      emFoco: false,
      pdmsSimplificados: false,
      metaSimplificada: false,
      arvoreDeMetas: false,
      mudarStatus: false,
      transferirDePortfolio: false,
      arquivos: false,
      listaDeTodosIds: false,
    },
    erro: null,
    erros: {
      arquivos: null,
      pdmsSimplificados: null,
      metaSimplificada: null,
      arvoreDeMetas: null,
    },
    paginacao: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: true,
      totalRegistros: 0,
    },
  }),
  actions: {
    async buscarItem(id = 0, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      this.ultimoVistoId = id;
      sessionStorage.setItem('obras.ultimoVistoId', this.ultimoVistoId);

      try {
        const resposta = await this.requestS.get(`${baseUrl}/projeto-mdo/${id}`, params);
        this.emFoco = {
          ...resposta,
        };
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarPdms(params = {}) {
      this.chamadasPendentes.pdmsSimplificados = true;
      this.pdmsSimplificados = [];
      this.erros.pdmsSimplificados = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto-mdo/proxy/pdm-e-metas`, params);
        this.pdmsSimplificados = linhas;
      } catch (erro) {
        this.erros.pdmsSimplificados = erro;
      }
      this.chamadasPendentes.pdmsSimplificados = false;
    },

    // Obsoleta! Substituir por `buscarArvoreDeMetas()`
    async buscarMetaSimplificada(params = {}) {
      this.chamadasPendentes.metaSimplificada = true;
      this.metaSimplificada = [];
      this.erros.metaSimplificada = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto-mdo/proxy/iniciativas-atividades`, params);
        [this.metaSimplificada] = linhas;
      } catch (erro) {
        this.erros.metaSimplificada = erro;
      }
      this.chamadasPendentes.metaSimplificada = false;
    },

    async buscarArvoreDeMetas(params = {}) {
      this.chamadasPendentes.arvoreDeMetas = true;
      this.erros.arvoreDeMetas = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto-mdo/proxy/iniciativas-atividades`, params);

        if (Array.isArray(linhas)) {
          linhas.forEach((cur) => {
            this.arvoreDeMetas[cur.id] = {
              ...cur,
              iniciativas: mapIniciativas(cur.iniciativas),
            };
          });
        }
      } catch (erro) {
        this.erros.arvoreDeMetas = erro;
      }
      this.chamadasPendentes.arvoreDeMetas = false;
    },

    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        const {
          linhas,
          total_registros_revisados: totalRegistrosRevisados,
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.get(`${baseUrl}/projeto-mdo`, params);

        this.lista = linhas;
        this.totalRegistrosRevisados = totalRegistrosRevisados;

        this.paginacao.tokenPaginacao = tokenPaginacao;
        this.paginacao.paginas = paginas;
        this.paginacao.paginaCorrente = paginaCorrente;
        this.paginacao.temMais = temMais;
        this.paginacao.totalRegistros = totalRegistros;

        sessionStorage.removeItem('obras.ultimoVistoId');
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },
    async buscarTodosIds(params = {}) {
      this.chamadasPendentes.listaDeTodosIds = true;
      try {
        const { ids } = await this.requestS.get(`${baseUrl}/projeto-mdo/ids`, params);

        this.listaDeTodosIds = ids;

        this.chamadasPendentes.listaDeTodosIds = false;
        return ids;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.listaDeTodosIds = false;
        throw erro;
      }
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/projeto-mdo/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0, schema = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto-mdo/${id}`, params, { schema });
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto-mdo`, params, { schema });
        }

        this.chamadasPendentes.emFoco = false;
        return resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async buscarArquivos(idDaObra = 0, params = {}) {
      this.chamadasPendentes.arquivos = true;
      this.erros.arquivos = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/projeto-mdo/${idDaObra || this.route.params.obraId}/documento`, params);

        if (Array.isArray(resposta.linhas)) {
          this.arquivos = resposta.linhas;
        }
      } catch (erro) {
        this.erros.arquivos = erro;
      }
      this.chamadasPendentes.arquivos = false;
    },

    async excluirArquivo(idDoArquivo, idDaObra = 0) {
      this.chamadasPendentes.arquivos = true;
      this.erros.arquivos = null;

      try {
        await this.requestS.delete(`${baseUrl}/projeto-mdo/${idDaObra || this.route.params.obraId}/documento/${idDoArquivo}`);

        this.arquivos = this.arquivos.filter((x) => x.id !== idDoArquivo);
        this.chamadasPendentes.arquivos = false;

        return true;
      } catch (erro) {
        this.erros.arquivos = erro;
        this.chamadasPendentes.arquivos = false;
        return false;
      }
    },

    async associarArquivo(params = {}, id = 0, idDaObra = 0) {
      this.chamadasPendentes.arquivos = true;
      this.erros.arquivos = null;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto-mdo/${idDaObra || this.route.params.obraId}/documento/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto-mdo/${idDaObra || this.route.params.obraId}/documento`, params);
        }

        this.chamadasPendentes.arquivos = false;
        return resposta;
      } catch (erro) {
        this.erros.arquivos = erro;
        this.chamadasPendentes.arquivos = false;
        return false;
      }
    },
    async marcarComoRevisado(id, revisado) {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      const item = this.itemPorId(id);

      try {
        const params = {
          obras: [{
            projeto_id: id,
            revisado,
          }],
        };
        await this.requestS.post(`${baseUrl}/projeto-mdo/revisar-obras/`, params);
        this.chamadasPendentes.lista = false;
        item.revisado = revisado;

        if (revisado) {
          this.totalRegistrosRevisados += 1;
        } else {
          this.totalRegistrosRevisados -= 1;
        }

        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },
    async marcarTodasComoNaoRevisadas() {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.post(`${baseUrl}/projeto-mdo/revisar-obras-todas/`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },
  },

  getters: {
    itemPorId: (state) => (id) => state.lista.find((item) => item.id === id),
    itemParaEdicao({ emFoco, route }) {
      return {
        ...emFoco,
        codigo: emFoco?.codigo ? undefined : null,
        colaboradores_no_orgao: Array.isArray(emFoco?.colaboradores_no_orgao)
          ? emFoco.colaboradores_no_orgao.map((x) => x.id)
          : [],
        equipamento_id: emFoco?.equipamento?.id || null,
        geolocalizacao: emFoco?.geolocalizacao?.map((x) => x.token) || [],
        grupo_tematico_id: emFoco?.grupo_tematico?.id || null,
        grupo_portfolio: emFoco?.grupo_portfolio.map(({ id }) => id) || [],
        mdo_previsao_inauguracao: dateTimeToDate(emFoco?.mdo_previsao_inauguracao) || null,
        orgao_executor_id: emFoco?.orgao_executor?.id || null,
        orgao_gestor_id: emFoco?.orgao_gestor?.id || null,
        orgao_origem_id: emFoco?.orgao_origem ? emFoco?.orgao_origem.id : null, // não editável
        orgao_colaborador_id: null,
        orgao_responsavel_id: emFoco?.orgao_responsavel?.id || null,
        origens_extra: Array.isArray(emFoco?.origens_extra)
          ? emFoco.origens_extra.map((origem) => simplificadorDeOrigem(origem, { origem_tipo: 'PdmSistema' }))
          : [],
        pdm_escolhido: emFoco?.meta?.pdm_id || null,
        portfolio_id: emFoco?.portfolio_id || route.query.portfolio_id || null,
        portfolios_compartilhados: Array.isArray(emFoco?.portfolios_compartilhados)
          ? emFoco.portfolios_compartilhados.map((x) => x.id)
          : [],
        previsao_custo: emFoco?.previsao_custo || null,
        previsao_inicio: dateTimeToDate(emFoco?.previsao_inicio) || null,
        previsao_termino: dateTimeToDate(emFoco?.previsao_termino) || null,
        programa_id: emFoco?.programa?.id || null,
        responsavel_id: emFoco?.responsavel?.id || null,
        responsaveis_no_orgao_gestor: Array.isArray(emFoco?.responsaveis_no_orgao_gestor)
          ? emFoco.responsaveis_no_orgao_gestor.map((x) => x.id)
          : [],
        tags: Array.isArray(emFoco?.tags)
          ? emFoco.tags.map((x) => x.id)
          : [],
        tipo_intervencao_id: emFoco?.tipo_intervencao?.id || null,
        regiao_ids: Array.isArray(emFoco?.regioes) ? emFoco.regioes.map((x) => x.id) : [],
        empreendimento_id: emFoco?.empreendimento?.id || null,
      };
    },

    geolocalizaçãoPorToken: ({ emFoco }) => (Array.isArray(emFoco?.geolocalizacao)
      ? emFoco?.geolocalizacao.reduce((acc, cur) => {
        acc[cur.token] = cur;
        return acc;
      }, {})
      : {}),

    arquivosPorId(estado) {
      const { arquivos } = estado;
      const result = arquivos.reduce((acc, cur) => {
        acc[cur.id] = {
          ...cur,
          arquivo: {
            ...cur.arquivo,
            data: dateTimeToDate(cur.data),
            descricao: cur.descricao,
            id: cur.id,
          },
        };
        return acc;
      }, {});
      return result;
    },

    pdmsPorId: ({ pdmsSimplificados }) => pdmsSimplificados
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    planosAgrupadosPorTipo: ({ pdmsSimplificados }) => {
      const grupos = pdmsSimplificados.reduce((acc, cur) => {
        if (!acc[cur.tipo]) {
          acc[cur.tipo] = [];
        }
        acc[cur.tipo].push(cur);
        return acc;
      }, {});

      const chaves = Object.keys(grupos).sort((a, b) => a.localeCompare(b));
      let i = 0;
      const resultado = {};

      while (i < chaves.length) {
        const chave = chaves[i];
        resultado[chave] = grupos[chave]
          .sort((a, b) => a.nome
            .localeCompare(b.nome));
        i += 1;
      }

      return resultado;
    },

    permissõesDaObraEmFoco: ({ emFoco }) => (typeof emFoco?.permissoes === 'object'
      ? emFoco.permissoes
      : {}),

    obrasPorPortfolio: ({ lista }) => lista
      .reduce((acc, cur) => {
        if (!acc[cur.portfolio.id]) {
          acc[cur.portfolio.id] = [];
        }
        acc[cur.portfolio.id].push(cur);
        return acc;
      }, {}),

    obrasPortfolioModeloClonagem: ({ lista }) => lista
      .filter((e) => e.portfolio.modelo_clonagem === true),

    órgãosEnvolvidosNaObraEmFoco: ({ emFoco }) => {
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

    diretóriosConsolidados: ({ arquivos, diretórios }) => consolidarDiretorios(
      arquivos,
      diretórios,
    ),
  },
});
