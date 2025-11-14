import Big from 'big.js';
import { defineStore } from 'pinia';

import toFloat from '@/helpers/toFloat';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(parametrosDeModulo = this.route.params) {
  switch (true) {
    // precisa vir antes de metas porque planos setoriais também as têm
    case !!parametrosDeModulo.planoSetorialId:
      return 'plano-setorial-';

    case !!parametrosDeModulo.projetoId:
      return `projeto/${parametrosDeModulo.projetoId}/`;

    case !!parametrosDeModulo.meta_id:
      return '';

    case !!parametrosDeModulo.obraId:
      return `projeto-mdo/${parametrosDeModulo.obraId}/`;

    default:
      console.trace('Caminho para orçamentos não pôde ser identificado:', parametrosDeModulo);
      throw new Error('Caminho para orçamentos não pôde ser identificado');
  }
}

function totalizador(anos, camposFornecidos) {
  const campos = Array.isArray(camposFornecidos) ? camposFornecidos : [camposFornecidos];

  const total = {
    anoDeInicio: 0,
    anoDeConclusao: 0,
    valor: {},
  };

  if (typeof anos !== 'object' || anos === null) {
    return total;
  }

  let i = 0;

  const listaDeAnos = Object.keys(anos);

  if (!listaDeAnos.length) {
    return total;
  }

  while (i < listaDeAnos.length) {
    const dotacoesDoAno = anos[listaDeAnos[i]];
    const ano = Number(listaDeAnos[i]);

    let j = 0;

    while (j < dotacoesDoAno.length) {
      const dotacao = dotacoesDoAno[j];

      if (Array.isArray(campos)) {
        campos.forEach((c) => {
          if (dotacao[c]) {
            if (!total.valor[c]) {
              total.valor[c] = new Big(0);
            }
            total.valor[c] = total.valor[c].plus(new Big(dotacao[c]));
          }
        });
      }

      j += 1;
    }

    total.anoDeInicio = Math.min(total.anoDeInicio || Infinity, ano) || 0;
    total.anoDeConclusao = Math.max(total.anoDeConclusao || -Infinity, ano) || 0;

    i += 1;
  }

  Object.keys(total.valor).forEach((key) => {
    total.valor[key] = total.valor[key].toString();
  });

  return total;
}

export const useOrcamentosStore = defineStore('Orcamentos', {
  state: () => ({
    OrcamentoCusteio: {},
    OrcamentoPlanejado: {},
    OrcamentoRealizado: {},
    OrcamentoRealizadoConclusao: {},
    OrcamentoRealizadoConclusaoAdmin: {},
    OrcamentoRealizadoPermissões: {},

    previstoEhZero: {},
    previstoEhZeroCriadoPor: {},
    previstoEhZeroCriadoEm: {},
  }),
  actions: {
    clear() {
      this.OrcamentoCusteio = {};
      this.OrcamentoPlanejado = {};
      this.OrcamentoRealizado = {};
    },

    // metas
    async getById(id, ano) {
      this.getOrcamentoCusteioById(id, ano);
      this.getOrcamentoPlanejadoById(id, ano);
      this.getOrcamentoRealizadoById(id, ano);
    },
    async getOrcamentoCusteioById(id, ano, parametrosDeModulo = this.route.params) {
      try {
        this.OrcamentoCusteio[ano] = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-previsto/?meta_id=${id}&ano_referencia=${ano}`);
        this.OrcamentoCusteio[ano] = r.linhas ? r.linhas : r;

        if (typeof r.previsto_eh_zero === 'boolean') {
          this.previstoEhZero[ano] = r.previsto_eh_zero;
        }
        if (r.previsto_eh_zero_criado_por?.nome_exibicao) {
          this.previstoEhZeroCriadoPor[ano] = r.previsto_eh_zero_criado_por;
        }
        if (r.previsto_eh_zero_criado_em) {
          this.previstoEhZeroCriadoEm[ano] = r.previsto_eh_zero_criado_em;
        }
      } catch (error) {
        this.OrcamentoCusteio[ano] = { error };
      }
    },
    async getOrcamentoPlanejadoById(idOrParams, ano, parametrosDeModulo = this.route.params) {
      const params = typeof idOrParams === 'object'
        ? idOrParams
        : {
          meta_id: idOrParams,
          ano_referencia: ano,
        };

      if (ano) {
        params.ano_referencia = ano;
      }

      try {
        this.OrcamentoPlanejado[ano] = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-planejado/`, params);
        this.OrcamentoPlanejado[ano] = r.linhas ? r.linhas : r;
      } catch (error) {
        this.OrcamentoPlanejado[ano] = { error };
      }
    },
    async getOrcamentoRealizadoById(idOrParams, ano, parametrosDeModulo = this.route.params) {
      const params = typeof idOrParams === 'object'
        ? idOrParams
        : {
          meta_id: idOrParams,
          ano_referencia: ano,
        };

      if (ano) {
        params.ano_referencia = ano;
      }

      try {
        this.OrcamentoRealizado[ano] = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-realizado/`, params);

        this.OrcamentoRealizado[ano] = r.linhas ? r.linhas : r;

        if (r.concluido) {
          this.OrcamentoRealizadoConclusao[ano] = r.concluido;
        }
        if (r.concluido_admin) {
          this.OrcamentoRealizadoConclusaoAdmin[ano] = r.concluido_admin;
        }
        if (r.permissoes) {
          this.OrcamentoRealizadoPermissões[ano] = r.permissoes;
        }
      } catch (error) {
        this.OrcamentoRealizado[ano] = { error };
      }
    },

    // projetos & obras
    // eslint-disable-next-line max-len, default-param-last
    async buscarOrçamentosPrevistosParaAno(ano = this.route.params.ano, parametrosDeModulo = this.route.params, extraParams = {}) {
      try {
        this.OrcamentoCusteio[ano] = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-previsto`, { ...extraParams, ano_referencia: ano });

        this.OrcamentoCusteio[ano] = r.linhas ? r.linhas : r;

        if (typeof r.previsto_eh_zero === 'boolean') {
          this.previstoEhZero[ano] = r.previsto_eh_zero;
        }
        if (r.previsto_eh_zero_criado_por?.nome_exibicao) {
          this.previstoEhZeroCriadoPor[ano] = r.previsto_eh_zero_criado_por;
        }
        if (r.previsto_eh_zero_criado_em) {
          this.previstoEhZeroCriadoEm[ano] = r.previsto_eh_zero_criado_em;
        }
      } catch (error) {
        this.OrcamentoCusteio[ano] = { error };
      }
    },

    // eslint-disable-next-line max-len, default-param-last
    async buscarOrçamentosPlanejadosParaAno(ano = this.route.params.ano, parametrosDeModulo = this.route.params, extraParams = {}) {
      try {
        this.OrcamentoPlanejado[ano] = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-planejado`, { ...extraParams, ano_referencia: ano });

        this.OrcamentoPlanejado[ano] = r.linhas ? r.linhas : r;
      } catch (error) {
        this.OrcamentoPlanejado[ano] = { error };
      }
    },

    // eslint-disable-next-line max-len, default-param-last
    async buscarOrçamentosRealizadosParaAno(ano = this.route.params.ano, parametrosDeModulo = this.route.params, extraParams = {}) {
      try {
        this.OrcamentoRealizado[ano] = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-realizado`, { ...extraParams, ano_referencia: ano });

        this.OrcamentoRealizado[ano] = r.linhas ? r.linhas : r;
      } catch (error) {
        this.OrcamentoRealizado[ano] = { error };
      }
    },

    // METAS & PROJETOS & OBRAS
    async restringirPrevistoAZero(ano, params, parametrosDeModulo = this.route.params) {
      const parâmetrosCompletos = {
        considerar_zero: true,
        ano_referencia: ano,
        ...params,
      };

      if (this.route.params.meta_id && !parâmetrosCompletos.meta_id) {
        parâmetrosCompletos.meta_id = Number(this.route.params.meta_id);
      } else if (this.route.params.projetoId && !parâmetrosCompletos.projeto_id) {
        parâmetrosCompletos.projeto_id = Number(this.route.params.projetoId);
      }

      try {
        if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-previsto/zerado/`, parâmetrosCompletos)) {
          if (parâmetrosCompletos.meta_id) {
            this.getOrcamentoCusteioById(parâmetrosCompletos.meta_id, ano);
          } else if (parâmetrosCompletos.projeto_id) {
            this.buscarOrçamentosPrevistosParaAno(ano, parametrosDeModulo);
          }
        }

        return true;
      } catch (error) {
        return false;
      }
    },

    // Custeio
    async updateOrcamentoCusteio(id, params, parametrosDeModulo = this.route.params) {
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-previsto/${id}`, params)) return true;
      return false;
    },
    async insertOrcamentoCusteio(params, parametrosDeModulo = this.route.params) {
      if (await this.requestS.post(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-previsto/`, params)) return true;
      return false;
    },
    async deleteOrcamentoCusteio(id, parametrosDeModulo = this.route.params) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-previsto/${id}`)) return true;
      return false;
    },

    // Planejado
    async updateOrcamentoPlanejado(id, params, parametrosDeModulo = this.route.params) {
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-planejado/${id}`, params)) return true;
      return false;
    },
    async insertOrcamentoPlanejado(params, parametrosDeModulo = this.route.params) {
      if (await this.requestS.post(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-planejado/`, params)) return true;
      return false;
    },
    async deleteOrcamentoPlanejado(id, parametrosDeModulo = this.route.params) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-planejado/${id}`)) return true;
      return false;
    },

    // Realizado
    async updateOrcamentoRealizado(id, params, parametrosDeModulo = this.route.params) {
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-realizado/${id}`, params)) return true;
      return false;
    },
    async closeOrcamentoRealizado(params, parametrosDeModulo = this.route.params) {
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-realizado/orcamento-concluido`, params)) return true;
      return false;
    },
    async closeOrcamentoRealizadoPorOrgao(params, parametrosDeModulo = this.route.params) {
      return !!await this.requestS.patch(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-realizado/orcamento-concluido-admin`, params);
    },
    async insertOrcamentoRealizado(params, parametrosDeModulo = this.route.params) {
      if (await this.requestS.post(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-realizado/`, params)) return true;
      return false;
    },
    async deleteOrcamentoRealizado(id, parametrosDeModulo = this.route.params) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-realizado/${id}`)) return true;
      return false;
    },
    async deleteOrcamentosRealizadosEmLote(ids, parametrosDeModulo = this.route.params) {
      if (await this.requestS.delete(`${baseUrl}/${caminhoParaApi(parametrosDeModulo)}orcamento-realizado/em-lote/`, ids)) return true;
      return false;
    },
  },

  getters: {
    orçamentoEmFoco({ OrcamentoRealizado }) {
      const { ano, id } = this.route.params;
      const anoEmFoco = Array.isArray(OrcamentoRealizado?.[ano])
        ? OrcamentoRealizado[ano]
        : [];

      return anoEmFoco.find((x) => x.id == id);
    },

    líquidoDosItens() {
      const {
        smae_soma_valor_empenho = '0',
        smae_soma_valor_liquidado = '0',
        soma_valor_empenho = '0',
        soma_valor_liquidado = '0',
      } = this.orçamentoEmFoco || {};

      return {
        empenho: toFloat(smae_soma_valor_empenho) - toFloat(soma_valor_empenho),
        liquidação: toFloat(smae_soma_valor_liquidado) - toFloat(soma_valor_liquidado),
      };
    },

    custeioConsolidado: ({ OrcamentoCusteio }) => totalizador(OrcamentoCusteio, ['custo_previsto']),

    planejadoConsolidado: ({ OrcamentoPlanejado }) => totalizador(OrcamentoPlanejado, ['valor_planejado']),

    realizadoConsolidado: ({ OrcamentoRealizado }) => totalizador(OrcamentoRealizado, ['soma_valor_empenho', 'soma_valor_liquidado']),
  },
});
