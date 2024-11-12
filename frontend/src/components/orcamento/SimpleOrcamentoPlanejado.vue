<script setup>
// eslint-disable-next-line import/no-named-default
import { default as LinhaPlanejado } from '@/components/orcamento/LinhaPlanejado.vue';
import formataValor from '@/helpers/formataValor';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useObrasStore } from '@/stores/obras.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import FiltroPorOrgaoEUnidade from './FiltroPorOrgaoEUnidade.vue';
import agrupaFilhos from './helpers/agrupaFilhos';
import somaItems from './helpers/somaItems';

const projetosStore = useProjetosStore();
const obrasStore = useObrasStore();

const {
  permissõesDaObraEmFoco,
} = storeToRefs(obrasStore);

const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);

const props = defineProps({
  parentlink: {
    type: String,
    default: '',
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  etiquetaDosTotais: {
    type: String,
    default: 'Totais',
  },
});
// eslint-disable-next-line vue/no-setup-props-destructure
const ano = props.config.ano_referencia;
const OrcamentosStore = useOrcamentosStore();
const { OrcamentoPlanejado } = storeToRefs(OrcamentosStore);

const órgãoEUnidadeSelecionados = ref('');

const linhasFiltradas = computed(() => (Array.isArray(OrcamentoPlanejado.value[ano]) && órgãoEUnidadeSelecionados.value !== ''
  ? OrcamentoPlanejado.value[ano]
    .filter((x) => x.dotacao?.indexOf(órgãoEUnidadeSelecionados.value) === 0)
  : OrcamentoPlanejado.value[ano] || []));

const groups = computed(() => agrupaFilhos(linhasFiltradas.value));

const somasDaMeta = computed(() => (Array.isArray(linhasFiltradas.value)
  ? linhasFiltradas.value.reduce((acc, cur) => {
    if (acc === null) {
      // eslint-disable-next-line no-param-reassign
      acc = { valor_planejado: 0, pressao_orcamentaria_valor: 0 };
    }

    if (!cur.iniciativa && !cur.atividade) {
      acc.valor_planejado += Number.parseFloat(cur.valor_planejado) || 0;
      acc.pressao_orcamentaria_valor += Number.parseFloat(cur.pressao_orcamentaria_valor) || 0;
    }
    return acc;
  }, null)
  : null));

const somaDasLinhas = computed(() => ({
  valor_planejado: formataValor(somaItems(linhasFiltradas.value, 'valor_planejado')),
  pressao_orcamentaria_valor: formataValor(somaItems(linhasFiltradas.value, 'pressao_orcamentaria_valor')),
}));
</script>
<template>
  <div class="mb2">
    <div>
      <header>
        <h3 class="mb1 w700">
          {{ config.ano_referencia }}
        </h3>
      </header>

      <FiltroPorOrgaoEUnidade
        v-if="OrcamentoPlanejado[ano]?.length > 1"
        v-model="órgãoEUnidadeSelecionados"
        :ano="ano"
        :lista="Array.isArray(OrcamentoPlanejado[ano])
          ? OrcamentoPlanejado[ano]
          : []"
      />
      <div class="tablepreinfo">
        <div class="t12 lh1 w700 mb05">
          Orçamento Planejado
        </div>
        <div
          v-if="linhasFiltradas?.length"
          class="t12 lh1 w700"
        >
          <span class="tc300">
            Planejado total:
          </span>
          <span class="tvermelho">
            {{ somaDasLinhas.valor_planejado }}
          </span>
        </div>
      </div>

      <div
        v-if="OrcamentoPlanejado[ano]?.loading"
        class="spinner pt1 pr2 pb1 pl1"
      >
        Carregando
      </div>

      <table
        v-if="linhasFiltradas?.length"
        class="tablemain fix no-zebra horizontal-lines"
      >
        <thead>
          <tr>
            <th style="width: 50%">
              Dotação
            </th>
            <th style="width: 30%">
              planejado
            </th>
            <th style="width: 210px; overflow: visible;">
              <span>pressão orçamentária</span> <div class="tipinfo right">
                <svg
                  width="20"
                  height="20"
                >
                  <use xlink:href="#i_i" />
                </svg>
                <div>Excedente no PdM em relação ao valor da dotação</div>
              </div>
            </th>
            <th style="width: 50px" />
          </tr>
          <template v-if="linhasFiltradas?.length">
            <th class="tc600 w700 pl1">
              {{ $props.etiquetaDosTotais }}
            </th>
            <td class="w700">
              {{ somasDaMeta.valor_planejado
                ? formataValor(somasDaMeta.valor_planejado)
                : '-'
              }}
            </td>
            <td class="w700">
              {{ somasDaMeta.pressao_orcamentaria_valor
                ? formataValor(somasDaMeta.pressao_orcamentaria_valor)
                : '-'
              }}
            </td>
          </template>
        </thead>
        <template v-if="groups">
          <tbody>
            <LinhaPlanejado
              :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
              :group="groups"
              :permissao="config.planejado_disponivel"
              :parentlink="parentlink"
            />
          </tbody>

          <template
            v-for="(g, k) in groups.filhos"
            :key="k"
          >
            <tbody>
              <tr>
                <td class="tc600 w700 pl1">
                  {{ g.label }}
                </td>
                <td class="w700">
                  {{ g.items.length
                    ? formataValor(g.items.reduce((red, x) => red + Number(x.valor_planejado), 0))
                    : '-' }}
                </td>
                <td class="w700" />
                <td />
              </tr>
              <LinhaPlanejado
                :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
                :group="g"
                :permissao="config.planejado_disponivel"
                :parentlink="parentlink"
              />
            </tbody>
            <template
              v-for="(gg, kk) in g.filhos"
              :key="kk"
            >
              <tbody>
                <tr>
                  <td class="tc600 w700 pl2">
                    {{ gg.label }}
                  </td>
                  <td class="w700">
                    {{ gg.items.length
                      ? formataValor(gg.items.reduce(
                        (red, x) => red + Number(x.valor_planejado), 0))
                      : '-' }}
                  </td>
                  <td class="w700" />
                  <td />
                </tr>
                <LinhaPlanejado
                  :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
                  :group="gg"
                  :permissao="config.planejado_disponivel"
                  :parentlink="parentlink"
                />
              </tbody>
            </template>
          </template>
        </template>
      </table>
      <div class="tc">
        <SmaeLink
          v-if="config.planejado_disponivel
            && ($route.meta?.rotaParaAdição || parentlink)
            && (!permissõesDaObraEmFoco?.apenas_leitura || !permissõesDoProjetoEmFoco?.apenas_leitura)"
          :to="$route.meta?.rotaParaAdição
            ? { name: $route.meta.rotaParaAdição, params: { ano } }
            : `${parentlink}/orcamento/planejado/${ano}`"
          class="addlink mt1 mb1"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg> <span>Adicionar dotação</span>
        </SmaeLink>
        <span
          v-else
          class="addlink disabled mt1 mb1"
        ><svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg> <span>Adicionar dotação</span></span>
      </div>
    </div>
  </div>
</template>
