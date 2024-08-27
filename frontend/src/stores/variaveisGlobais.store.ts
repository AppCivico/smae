import type { ListSeriesAgrupadas, VariavelDetailDto, VariavelGlobalDetailDto } from '@/../../backend/src/variavel/dto/list-variavel.dto';
import type { VariavelGlobalItemDto } from '@/../../backend/src/variavel/entities/variavel.entity';

import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface ChamadasPendentes {
  lista: boolean;
  variaveisFilhasPorMae: { [key: string | number]: boolean };
  emFoco: boolean;
}

interface Erros {
  lista: unknown;
  variaveisFilhasPorMae: { [key: string | number]: unknown };
  emFoco: unknown;
}

interface Estado {
  lista: VariavelGlobalItemDto[];
  emFoco: (VariavelDetailDto & VariavelGlobalDetailDto) | null;
  seriesAgrupadas: ListSeriesAgrupadas | null;
  variaveisFilhasPorMae: { [key: string | number]: VariavelGlobalItemDto[] };

  chamadasPendentes: ChamadasPendentes;
  erros: Erros;

  paginacao: {
    tokenPaginacao: string;
    paginas: number;
    paginaCorrente: number;
    temMais: boolean;
    totalRegistros: number;
  };
}

const caminhoDeBuscaDeVariaveis = `${baseUrl}/variavel`;

export const useVariaveisGlobaisStore = defineStore('variaveisGlobais', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    seriesAgrupadas: null,
    variaveisFilhasPorMae: {},

    chamadasPendentes: {
      lista: false,
      variaveisFilhasPorMae: {},
      emFoco: false,
    },
    erros: {
      lista: null,
      variaveisFilhasPorMae: {},
      emFoco: null,
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
    async buscarItem(variavelId: number, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/variavel/${variavelId || this.route.params.variavelId}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarFilhas(variavelId: number, params = {}): Promise<void> {
      this.chamadasPendentes.variaveisFilhasPorMae[variavelId] = true;
      this.erros.variaveisFilhasPorMae[variavelId] = null;

      try {
        const resposta = await this.requestS.get(caminhoDeBuscaDeVariaveis, {
          ipp: 1000,
          ...params,
          variavel_mae_id: variavelId,
        });

        this.variaveisFilhasPorMae[variavelId] = resposta.linhas.slice();
      } catch (erro: unknown) {
        this.erros.variaveisFilhasPorMae[variavelId] = erro;
      }
      this.chamadasPendentes.variaveisFilhasPorMae[variavelId] = false;
    },

    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;

      try {
        const {
          linhas,
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.get(caminhoDeBuscaDeVariaveis, params);

        this.lista = linhas;

        this.paginacao.tokenPaginacao = tokenPaginacao;
        this.paginacao.paginas = paginas;
        this.paginacao.paginaCorrente = paginaCorrente;
        this.paginacao.temMais = temMais;
        this.paginacao.totalRegistros = totalRegistros;
      } catch (erro: unknown) {
        this.erros.lista = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(variavelId: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/variavel/${variavelId || this.route.params.variavelId}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, variavelId = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (variavelId) {
          resposta = await this.requestS.patch(`${baseUrl}/variavel/${variavelId || this.route.params.variavelId}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/variavel`, params);
        }

        this.chamadasPendentes.emFoco = false;
        this.erros.emFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async buscarSerie(variavelId: number | string, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/variavel/${variavelId || this.route.params.variavelId}/serie`, params);

        this.seriesAgrupadas = resposta;
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async salvarSeries(params = {}): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        const resposta = await this.requestS.patch(`${baseUrl}/variavel-serie/`, params);

        this.chamadasPendentes.emFoco = false;
        this.erros.emFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async gerarItens(params = {}): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/variavel/gerador-regionalizado`, params);

        this.chamadasPendentes.emFoco = false;
        this.erros.emFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
  getters: {
    itemParaEdição: ({ emFoco }) => ({
      ...emFoco,
      acumulativa: emFoco?.acumulativa || false,
      assuntos: Array.isArray(emFoco?.assuntos)
        ? emFoco.assuntos.map((assunto) => assunto.id)
        : [],
      casas_decimais: emFoco?.casas_decimais || 0,
      dado_aberto: emFoco?.dado_aberto || true,
      fim_medicao: emFoco?.fim_medicao || null,
      fonte_id: emFoco?.fonte?.id || null,
      inicio_medicao: emFoco?.inicio_medicao || null,
      liberacao_grupo_ids: Array.isArray(emFoco?.liberacao_grupo_ids)
        ? emFoco.liberacao_grupo_ids
        : [],
      medicao_grupo_ids: Array.isArray(emFoco?.medicao_grupo_ids)
        ? emFoco.medicao_grupo_ids
        : [],
      mostrar_monitoramento: emFoco?.mostrar_monitoramento || false,
      orgao_id: emFoco?.orgao?.id || null,
      orgao_proprietario_id: emFoco?.orgao_proprietario?.id
        || null,
      periodicidade: emFoco?.periodicidade || '',
      periodos: typeof emFoco?.periodos === 'object'
        ? emFoco?.periodos
        : {
          preenchimento_inicio: null,
          preenchimento_fim: null,
          validacao_inicio: null,
          validacao_fim: null,
          liberacao_inicio: null,
          liberacao_fim: null,
        },
      polaridade: emFoco?.polaridade || null,
      titulo: emFoco?.titulo || '',
      unidade_medida_id: emFoco?.unidade_medida?.id
        || null,
      validacao_grupo_ids: Array.isArray(emFoco?.validacao_grupo_ids)
        ? emFoco.validacao_grupo_ids
        : [],
      valor_base: emFoco?.valor_base ? String(emFoco.valor_base) : '0',
      variavel_categorica_id: emFoco?.variavel_categorica_id || null,
    }),

    variaveisPorId: ({ lista }: Estado) => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

    filhasPorMaePorNivelDeRegiao: ({ variaveisFilhasPorMae }) => Object.keys(variaveisFilhasPorMae)
      .reduce((acc, maeId) => {
        let nivelMaisFino = 0;

        const filhasAgrupadas = variaveisFilhasPorMae[maeId].reduce((acc2, cur) => {
          const agrupador = cur.supraregional && !cur.regiao?.nivel
            ? 'supraregional'
            : Number(cur.regiao?.nivel) || 0;

          if (!acc2[agrupador]) {
            // eslint-disable-next-line no-param-reassign
            acc2[agrupador] = [];
          }

          if (agrupador > nivelMaisFino) {
            nivelMaisFino = agrupador;
          }

          acc2[agrupador].push(cur);

          return acc2;
        }, {} as { [key: string]: VariavelGlobalItemDto[] });

        if (nivelMaisFino && filhasAgrupadas.supraregional) {
          filhasAgrupadas[nivelMaisFino] = filhasAgrupadas[nivelMaisFino]
            .concat(filhasAgrupadas.supraregional);

          delete filhasAgrupadas.supraregional;
        }

        acc[maeId] = filhasAgrupadas;

        return acc;
      }, {} as { [key: string]: { [key: string]: VariavelGlobalItemDto[] } }),
  },
});
