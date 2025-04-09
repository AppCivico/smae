import { defineStore } from 'pinia';
import type { PaginatedWithPagesDto } from '@back/common/dto/paginated.dto';
import type { RecordWithId } from '@back/common/dto/record-with-id.dto';
import type {
  ListPdmSimplesDto,
  ListSeriesAgrupadas, VariavelDetailComAuxiliaresDto, VariavelDetailDto, VariavelGlobalDetailDto,
} from '@back/variavel/dto/list-variavel.dto';
import type { VariavelGlobalItemDto } from '@back/variavel/entities/variavel.entity';
import type { ValoresSelecionados } from '@/components/AgrupadorDeAutocomplete.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Variavel = VariavelDetailDto & VariavelGlobalDetailDto & VariavelDetailComAuxiliaresDto ;

export type PlanosSimplificadosPorTipo = {
  [key: string]: ListPdmSimplesDto['linhas']
};

interface Estado {
  lista: VariavelGlobalItemDto[];
  emFoco: Variavel | null;
  seriesAgrupadas: ListSeriesAgrupadas | null;
  variaveisFilhasPorMae: { [key: string | number]: VariavelGlobalItemDto[] };

  planosSimplificados: ListPdmSimplesDto['linhas'];

  chamadasPendentes: ChamadasPendentes & {
    planosSimplificados: boolean;
    variaveisFilhasPorMae: { [key: string | number]: boolean };
  };
  erros: Erros & {
    planosSimplificados: unknown;
    variaveisFilhasPorMae: { [key: string | number]: unknown };
  };

  paginacao: Paginacao;
}

const caminhoDeBuscaDeVariaveis = `${baseUrl}/variavel`;

export const useVariaveisGlobaisStore = defineStore('variaveisGlobais', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    seriesAgrupadas: null,
    variaveisFilhasPorMae: {},
    planosSimplificados: [],

    chamadasPendentes: {
      lista: false,
      variaveisFilhasPorMae: {},
      planosSimplificados: false,
      emFoco: false,
    },
    erros: {
      lista: null,
      variaveisFilhasPorMae: {},
      planosSimplificados: null,
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
        const resposta = await this.requestS.get(
          `${baseUrl}/variavel/${variavelId || this.route.params.variavelId}`,
          params,
        ) as Variavel;

        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },

    async buscarFilhas(variavelId: number, params = {}): Promise<void> {
      this.chamadasPendentes.variaveisFilhasPorMae[variavelId] = true;
      this.erros.variaveisFilhasPorMae[variavelId] = null;

      try {
        const resposta = await this.requestS.get(caminhoDeBuscaDeVariaveis, {
          ipp: 1000,
          ...params,
          variavel_mae_id: variavelId,
        }) as PaginatedWithPagesDto<VariavelGlobalItemDto>;

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
        } = await this.requestS.get(
          caminhoDeBuscaDeVariaveis,
          params,
        ) as PaginatedWithPagesDto<VariavelGlobalItemDto>;

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

    async buscarPlanosSimplificados(params = {}): Promise<void> {
      this.chamadasPendentes.planosSimplificados = true;
      this.erros.planosSimplificados = null;
      this.planosSimplificados = [];
      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/proxy/pdm-e-planos-setoriais`,
          params,
        ) as ListPdmSimplesDto;
        this.planosSimplificados = resposta.linhas;
      } catch (erro: unknown) {
        this.erros.planosSimplificados = erro;
      }

      this.chamadasPendentes.planosSimplificados = false;
    },

    async excluirItem(variavelId: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(
          `${baseUrl}/variavel/${variavelId || this.route.params.variavelId}`,
        );

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, variavelId = 0): Promise<RecordWithId | boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (variavelId) {
          resposta = await this.requestS.patch(
            `${baseUrl}/variavel/${variavelId || this.route.params.variavelId}`,
            params,
          ) as RecordWithId;
        } else {
          resposta = await this.requestS.post(`${baseUrl}/variavel`, params) as RecordWithId;
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
        const resposta = await this.requestS.get(
          `${baseUrl}/variavel/${
            variavelId || this.route.params.variavelId
          }/serie`,
          params,
        ) as ListSeriesAgrupadas;

        this.seriesAgrupadas = resposta;
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async salvarSeries(params = {}): Promise<RecordWithId | boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        const resposta = await this.requestS.patch(
          `${baseUrl}/variavel-serie/`,
          params,
        ) as RecordWithId;

        this.chamadasPendentes.emFoco = false;
        this.erros.emFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async gerarItens(params = {}): Promise<RecordWithId | boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        const resposta = await this.requestS.post(
          `${baseUrl}/variavel/gerador-regionalizado`,
          params,
        ) as RecordWithId;

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
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      acumulativa: emFoco?.acumulativa || false,
      assuntos: Array.isArray(emFoco?.assuntos)
        ? emFoco.assuntos.map((assunto) => assunto.id)
        : [],
      assuntos_mapeados: Array.isArray(emFoco?.assuntos)
        ? emFoco.assuntos.reduce<ValoresSelecionados>((amount, item) => {
          if (!item.categoria_assunto_variavel_id) {
            return amount;
          }

          const categoriaAdicionadaIndex = amount.findIndex(
            (itemAdicionado) => itemAdicionado.agrupadorId
                  === item.categoria_assunto_variavel_id,
          );

          if (categoriaAdicionadaIndex === -1) {
            amount.push({
              agrupadorId: item.categoria_assunto_variavel_id,
              itemId: [item.id],
            });
          } else {
            amount[categoriaAdicionadaIndex].itemId?.push(item.id);
          }

          return amount;
        }, [] as ValoresSelecionados)
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
      orgao_proprietario_id: emFoco?.orgao_proprietario?.id || null,
      periodicidade: emFoco?.periodicidade || '',
      periodos:
        typeof emFoco?.periodos === 'object'
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
      unidade_medida_id: emFoco?.unidade_medida?.id || null,
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

        const filhasAgrupadas = variaveisFilhasPorMae[maeId].reduce(
          (acc2, cur) => {
            const agrupador = cur.supraregional && !cur.regiao?.nivel
              ? 'supraregional'
              : Number(cur.regiao?.nivel) || 0;

            if (!acc2[agrupador]) {
            // eslint-disable-next-line no-param-reassign
              acc2[agrupador] = [];
            }

            if (agrupador !== 'supraregional' && agrupador > nivelMaisFino) {
              nivelMaisFino = agrupador;
            }

            acc2[agrupador].push(cur);

            return acc2;
          },
          {} as { [key: string]: VariavelGlobalItemDto[] },
        );

        if (nivelMaisFino && filhasAgrupadas.supraregional) {
          filhasAgrupadas[nivelMaisFino] = filhasAgrupadas[
            nivelMaisFino
          ].concat(filhasAgrupadas.supraregional);

          delete filhasAgrupadas.supraregional;
        }

        acc[maeId] = filhasAgrupadas;

        return acc;
      }, {} as { [key: string]: { [key: string]: VariavelGlobalItemDto[] } }),

    planosSimplificadosPorTipo: ({ planosSimplificados }) => planosSimplificados
      .reduce((acc, cur) => {
        const tipo = cur.tipo || 'outros';

        if (!acc[tipo]) {
          acc[tipo] = [];
        }

        acc[tipo].push(cur);

        return acc;
      }, {} as PlanosSimplificadosPorTipo),
  },
});
