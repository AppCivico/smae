<script lang="ts" setup>
import type { IdCodTituloDto } from '@back/common/dto/IdCodTitulo.dto';
import type {
  PdmInfoDto,
  VarGlobalRelIndicadorBaseDto,
  VarGlobalRelIndicadorDto,
} from '@back/variavel/relacionados/dto/variavel.relacionamento.dto';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store';

type Props = {
  variavelId: number;
};

type GrupoDeIndicadores = {
  plano: PdmInfoDto;
  indicadores: VarGlobalRelIndicadorDto[];
  exibirIniciativa: boolean;
  exibirAtividade: boolean;
  exibirVariavel: boolean;
};

const props = defineProps<Props>();

const variaveisGlobaisStore = useVariaveisGlobaisStore();

const {
  relacionamentos,
  metasSimplificadas,
  chamadasPendentes,
  erros,
} = storeToRefs(variaveisGlobaisStore);

const nomesDosTipos: Record<string, string> = {
  PS: 'Plano Setorial',
  PDM: 'Programa de Metas',
};

// a lista de metas do Banco de Variáveis só traz planos que não são PdM legado
const idsDePlanosNaoLegados = computed<Set<number>>(() => new Set(
  metasSimplificadas.value.map((meta) => meta.pdm_id),
));

const planosPorId = computed<Record<number, PdmInfoDto>>(() => (
  relacionamentos.value?.pdm_info || []
).reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {} as Record<number, PdmInfoDto>));

function profundidade(indicador: VarGlobalRelIndicadorDto): number {
  return Number(!!indicador.iniciativa) + Number(!!indicador.atividade);
}

function formatarItem(item?: IdCodTituloDto | null): string {
  return item ? `${item.codigo} - ${item.titulo}` : '-';
}

function relacaoComAVariavel(variavel: IdCodTituloDto): string {
  if (relacionamentos.value?.variavel_mae?.id === variavel.id) {
    return 'mãe';
  }
  if (relacionamentos.value?.variaveis_filhas?.some((filha) => filha.id === variavel.id)) {
    return 'filha';
  }
  return '';
}

const indicadoresPorPlano = computed<GrupoDeIndicadores[]>(() => {
  if (!relacionamentos.value) {
    return [];
  }

  // a consulta repete o indicador de meta/iniciativa em cada nível abaixo; vale o mais raso
  const unicos = new Map<string, VarGlobalRelIndicadorDto>();
  relacionamentos.value.indicadores_referenciando.forEach((indicador) => {
    const chave = `${indicador.id}-${indicador.variavel.id}`;
    const existente = unicos.get(chave);

    if (!existente || profundidade(indicador) < profundidade(existente)) {
      unicos.set(chave, indicador);
    }
  });

  const porPlano = [...unicos.values()].reduce((acc, cur) => {
    if (cur.pdm_id === null) {
      return acc;
    }
    if (!acc[cur.pdm_id]) {
      acc[cur.pdm_id] = [];
    }
    acc[cur.pdm_id].push(cur);
    return acc;
  }, {} as Record<number, VarGlobalRelIndicadorDto[]>);

  return relacionamentos.value.pdm_info
    .filter((plano) => porPlano[plano.id]?.length)
    .map((plano) => {
      const indicadores = porPlano[plano.id];

      return {
        plano,
        indicadores,
        exibirIniciativa: indicadores.some((indicador) => !!indicador.iniciativa),
        exibirAtividade: indicadores.some((indicador) => !!indicador.atividade),
        exibirVariavel: indicadores.some((indicador) => indicador.variavel.id !== props.variavelId),
      };
    });
});

const formulas = computed(() => relacionamentos.value?.formulas_compostas_referenciando || []);

const exibirIndicadoresNasFormulas = computed<boolean>(() => formulas.value
  .some((formula) => formula.indicadores.length));

function planoDoIndicador(indicador: VarGlobalRelIndicadorBaseDto): PdmInfoDto | undefined {
  return indicador.pdm_id !== null ? planosPorId.value[indicador.pdm_id] : undefined;
}

const exibirVariavelNasFormulas = computed<boolean>(() => formulas.value
  .some((formula) => formula.variavel.id !== props.variavelId));

const outrasFilhas = computed<IdCodTituloDto[]>(() => (
  relacionamentos.value?.variaveis_filhas || []
).filter((filha) => filha.id !== props.variavelId));

const naoEhUtilizada = computed<boolean>(() => !indicadoresPorPlano.value.length
  && !formulas.value.length);

function rotaDoIndicador(
  indicador: VarGlobalRelIndicadorBaseDto,
  plano?: PdmInfoDto,
): RouteLocationRaw | null {
  let entidadeMae: string;

  if (!plano) {
    return null;
  }

  if (plano.tipo === 'PS') {
    entidadeMae = 'planoSetorial';
  } else if (idsDePlanosNaoLegados.value.has(plano.id)) {
    entidadeMae = 'programaDeMetas';
  } else {
    return null;
  }

  if (!indicador.meta) {
    return null;
  }

  const params = {
    planoSetorialId: plano.id,
    meta_id: indicador.meta.id,
    indicador_id: indicador.id,
  };

  if (indicador.atividade && indicador.iniciativa) {
    return {
      name: `${entidadeMae}.indicadorDaAtividade`,
      params: {
        ...params,
        iniciativa_id: indicador.iniciativa.id,
        atividade_id: indicador.atividade.id,
      },
    };
  }

  if (indicador.iniciativa) {
    return {
      name: `${entidadeMae}.indicadorDaIniciativa`,
      params: { ...params, iniciativa_id: indicador.iniciativa.id },
    };
  }

  return { name: `${entidadeMae}.indicadorDaMeta`, params };
}

watch(() => props.variavelId, async (variavelId) => {
  if (!variavelId) {
    return;
  }

  await variaveisGlobaisStore.buscarRelacionamentos(variavelId);

  if (
    relacionamentos.value?.pdm_info.some((plano) => plano.tipo === 'PDM')
    && !metasSimplificadas.value.length
    && !chamadasPendentes.value.metasSimplificadas
  ) {
    variaveisGlobaisStore.buscarMetasSimplificadas();
  }
}, { immediate: true });
</script>

<template>
  <article class="mt2 flex column g2 onde-e-utilizada">
    <div class="flex center g2">
      <h2 class="onde-e-utilizada__divider-titulo">
        Onde é utilizada
      </h2>

      <hr class="f1">
    </div>

    <LoadingComponent v-if="chamadasPendentes.relacionamentos" />

    <ErrorComponent
      v-else-if="erros.relacionamentos"
      :erro="erros.relacionamentos"
    />

    <template v-else-if="relacionamentos">
      <p
        v-if="naoEhUtilizada && relacionamentos.utilizada_em_planos_removidos"
        class="tc300"
      >
        Esta variável foi utilizada apenas em indicadores de planos ou metas removidos.
      </p>
      <p
        v-else-if="naoEhUtilizada"
        class="tc300"
      >
        Esta variável não é utilizada em nenhum indicador nem em fórmula composta.
      </p>

      <section
        v-for="grupo in indicadoresPorPlano"
        :key="`plano--${grupo.plano.id}`"
      >
        <h3 class="t16 w700 mb1">
          {{ grupo.plano.nome }}
          <small class="tc300 w400">
            ({{ nomesDosTipos[grupo.plano.tipo] || grupo.plano.tipo }})
          </small>
        </h3>

        <table class="tablemain">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Meta</th>
              <th v-if="grupo.exibirIniciativa">
                {{ grupo.plano.rotulo_iniciativa || 'Iniciativa' }}
              </th>
              <th v-if="grupo.exibirAtividade">
                {{ grupo.plano.rotulo_atividade || 'Atividade' }}
              </th>
              <th v-if="grupo.exibirVariavel">
                Por meio da variável
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="indicador in grupo.indicadores"
              :key="`indicador--${indicador.id}--${indicador.variavel.id}`"
            >
              <td>
                <SmaeLink
                  v-if="rotaDoIndicador(indicador, grupo.plano)"
                  :to="rotaDoIndicador(indicador, grupo.plano)"
                  exibir-desabilitado
                >
                  {{ formatarItem(indicador) }}
                </SmaeLink>
                <template v-else>
                  {{ formatarItem(indicador) }}
                </template>
              </td>
              <td>{{ formatarItem(indicador.meta) }}</td>
              <td v-if="grupo.exibirIniciativa">
                {{ formatarItem(indicador.iniciativa) }}
              </td>
              <td v-if="grupo.exibirAtividade">
                {{ formatarItem(indicador.atividade) }}
              </td>
              <td v-if="grupo.exibirVariavel">
                <template v-if="indicador.variavel.id !== props.variavelId">
                  {{ formatarItem(indicador.variavel) }}
                  <small
                    v-if="relacaoComAVariavel(indicador.variavel)"
                    class="tc300"
                  >
                    ({{ relacaoComAVariavel(indicador.variavel) }})
                  </small>
                </template>
                <template v-else>
                  -
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="formulas.length">
        <h3 class="t16 w700 mb1">
          Fórmulas compostas
        </h3>

        <table class="tablemain">
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Plano</th>
              <th v-if="exibirIndicadoresNasFormulas">
                Indicador
              </th>
              <th v-if="exibirVariavelNasFormulas">
                Por meio da variável
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="formula in formulas"
              :key="`formula--${formula.id}--${formula.variavel.id}--${formula.pdm_id}`"
            >
              <td>{{ formula.titulo }}</td>
              <td>{{ nomesDosTipos[formula.tipo_pdm] || formula.tipo_pdm }}</td>
              <td>
                {{ formula.pdm_id !== null ? planosPorId[formula.pdm_id]?.nome || '-' : '-' }}
              </td>
              <td v-if="exibirIndicadoresNasFormulas">
                <ul
                  v-if="formula.indicadores.length"
                  class="lista-de-indicadores"
                >
                  <li
                    v-for="indicador in formula.indicadores"
                    :key="`formula--${formula.id}--indicador--${indicador.id}`"
                  >
                    <SmaeLink
                      v-if="rotaDoIndicador(indicador, planoDoIndicador(indicador))"
                      :to="rotaDoIndicador(indicador, planoDoIndicador(indicador))"
                      exibir-desabilitado
                    >
                      {{ formatarItem(indicador) }}
                    </SmaeLink>
                    <template v-else>
                      {{ formatarItem(indicador) }}
                    </template>
                  </li>
                </ul>
                <template v-else>
                  -
                </template>
              </td>
              <td v-if="exibirVariavelNasFormulas">
                <template v-if="formula.variavel.id !== props.variavelId">
                  {{ formatarItem(formula.variavel) }}
                  <small
                    v-if="relacaoComAVariavel(formula.variavel)"
                    class="tc300"
                  >
                    ({{ relacaoComAVariavel(formula.variavel) }})
                  </small>
                </template>
                <template v-else>
                  -
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="relacionamentos.variavel_mae || outrasFilhas.length">
        <h3 class="t16 w700 mb1">
          Variáveis relacionadas
        </h3>

        <p v-if="relacionamentos.variavel_mae">
          Variável mãe:
          <SmaeLink
            :to="{
              name: 'variaveisResumo',
              params: { variavelId: relacionamentos.variavel_mae.id },
            }"
            exibir-desabilitado
          >
            {{ formatarItem(relacionamentos.variavel_mae) }}
          </SmaeLink>
        </p>

        <details v-if="outrasFilhas.length">
          <summary>
            {{ relacionamentos.variavel_mae
              ? 'Outras filhas da mesma mãe'
              : 'Variáveis filhas' }}
            ({{ outrasFilhas.length }})
          </summary>

          <table class="tablemain mt1">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="filha in outrasFilhas"
                :key="`filha--${filha.id}`"
              >
                <td>{{ filha.codigo }}</td>
                <td>
                  <SmaeLink
                    :to="{
                      name: 'variaveisResumo',
                      params: { variavelId: filha.id },
                    }"
                    exibir-desabilitado
                  >
                    {{ filha.titulo }}
                  </SmaeLink>
                </td>
              </tr>
            </tbody>
          </table>
        </details>
      </section>
    </template>
  </article>
</template>

<style lang="less" scoped>
.onde-e-utilizada__divider-titulo {
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  color: #B8C0CC;
  white-space: nowrap;
  margin: 0;
}

.lista-de-indicadores {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
