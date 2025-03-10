<script setup>
// eslint-disable-next-line import/no-named-default
import { default as LinhaCusteio } from '@/components/orcamento/LinhaCusteio.vue';
import dateToField from '@/helpers/dateToField';
import formataValor from '@/helpers/formataValor';
import { useAlertStore, useOrcamentosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { usePdMStore } from '@/stores/pdm.store';
import { useObrasStore } from '@/stores/obras.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useRoute } from 'vue-router';
import FiltroPorOrgaoEUnidade from './FiltroPorOrgaoEUnidade.vue';
import agrupaFilhos from './helpers/agrupaFilhos';
import maiorData from './helpers/maiorData';
import somaItems from './helpers/somaItems';

const route = useRoute();

const alertStore = useAlertStore();
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
const {
  OrcamentoCusteio, previstoEhZero, previstoEhZeroCriadoPor, previstoEhZeroCriadoEm,
} = storeToRefs(OrcamentosStore);

const { activePdm } = storeToRefs(usePdMStore());

const projetosStore = useProjetosStore();
const obrasStore = useObrasStore();

const {
  permissõesDaObraEmFoco,
} = storeToRefs(obrasStore);

const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);

const órgãoEUnidadeSelecionados = ref('');

const permissoesDoItemEmFoco = computed(() => (route.params.entidadeMãe === 'obras'
  ? permissõesDaObraEmFoco.value
  : permissõesDoProjetoEmFoco.value));

const linhasFiltradas = computed(() => (Array.isArray(OrcamentoCusteio.value[ano]) && órgãoEUnidadeSelecionados.value !== ''
  ? OrcamentoCusteio.value[ano]
    .filter((x) => x.parte_dotacao?.indexOf(órgãoEUnidadeSelecionados.value) === 0)
  : OrcamentoCusteio.value[ano] || []));

const groups = computed(() => agrupaFilhos(linhasFiltradas.value));
const somasDaMeta = computed(() => (Array.isArray(linhasFiltradas.value)
  ? linhasFiltradas.value.reduce((acc, cur) => {
    if (acc === null) {
      // eslint-disable-next-line no-param-reassign
      acc = { custo_previsto: 0 };
    }

    if (!cur.iniciativa && !cur.atividade) {
      acc.custo_previsto += Number.parseFloat(cur.custo_previsto) || 0;
    }
    return acc;
  }, null)
  : null));

const somaDasLinhas = computed(() => ({
  custo_previsto: somaItems(linhasFiltradas.value, 'custo_previsto'),
}));

function restringirAZero() {
  alertStore.confirmAction(`Deseja mesmo informar que não há orçamento reservado para o ano de ${ano}?`, () => {
    OrcamentosStore.restringirPrevistoAZero(ano);
  }, 'Informar');
}
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
        v-if="OrcamentoCusteio[ano]?.length > 1"
        v-model="órgãoEUnidadeSelecionados"
        :ano="ano"
        :lista="Array.isArray(OrcamentoCusteio[ano])
          ? OrcamentoCusteio[ano]
          : []"
      />

      <div class="tablepreinfo">
        <div class="flex spacebetween">
          <div class="flex center">
            <div class="t12 lh1 w700">
              Previsão de custo
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="OrcamentoCusteio[ano]?.loading"
        class="spinner pt1 pr2 pb1 pl1"
      >
        Carregando
      </div>

      <table
        v-if="linhasFiltradas?.length || previstoEhZero[ano]"
        class="tablemain fix no-zebra horizontal-lines"
      >
        <thead>
          <tr>
            <th>
              Custo total
            </th>
            <th>
              Atualização mais recente
            </th>
            <th style="width: 50px" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="previstoEhZero[ano]">
            <td class="error">
              Custo
              <strong>{{ formataValor(0) }}</strong>
              <template v-if="previstoEhZeroCriadoPor[ano]?.nome_exibicao">
                informado por {{ previstoEhZeroCriadoPor[ano].nome_exibicao }}
              </template>
            </td>
            <td class="error">
              {{ previstoEhZeroCriadoEm[ano]
                ? dateToField(previstoEhZeroCriadoEm[ano])
                : '-' }}
            </td>
            <th
              class="error"
              style="width: 50px"
            />
          </tr>
          <tr v-else>
            <td>
              {{ formataValor(somaDasLinhas.custo_previsto) }}
            </td>
            <td>
              {{ dateToField(maiorData(linhasFiltradas, 'atualizado_em')) }}
            </td>
            <th style="width: 50px" />
          </tr>
        </tbody>
      </table>
      <table
        v-if="linhasFiltradas?.length"
        class="tablemain fix"
      >
        <thead>
          <tr>
            <th style="width: 50%">
              Dotação orcamentária
            </th>
            <th style="width: 25%">
              Previsão de custo
            </th>
            <th style="width: 25%">
              Atualizado em
            </th>
            <th style="width: 50px" />
          </tr>
          <template v-if="linhasFiltradas?.length">
            <th class="tc600 w700 pl1">
              {{ $props.etiquetaDosTotais }}
            </th>
            <td class="w700">
              {{ somasDaMeta.custo_previsto
                ? formataValor(somasDaMeta.custo_previsto)
                : '-' }}
            </td>
          </template>
        </thead>
        <template v-if="groups">
          <tbody>
            <LinhaCusteio
              :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
              :group="groups"
              :permissao="config.previsao_custo_disponivel
                && !permissoesDoItemEmFoco?.apenas_leitura"
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
                    ? formataValor(g.items.reduce((red, x) => red + Number(x.custo_previsto), 0))
                    : '-' }}
                </td>
                <td />
              </tr>
              <LinhaCusteio
                :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
                :group="g"
                :permissao="config.previsao_custo_disponivel
                  && !permissoesDoItemEmFoco?.apenas_leitura"
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
                      ? formataValor(gg.items.reduce((red, x) => red + Number(x.custo_previsto), 0))
                      : '-' }}
                  </td>

                  <td />
                </tr>
                <LinhaCusteio
                  :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
                  :group="gg"
                  :permissao="config.previsao_custo_disponivel
                    && !permissoesDoItemEmFoco?.apenas_leitura"
                  :parentlink="parentlink"
                />
              </tbody>
            </template>
          </template>
        </template>
      </table>

      <div class="tc">
        <SmaeLink
          v-if="config.previsao_custo_disponivel
            && ($route.meta?.rotaParaAdição || parentlink)
            && (activePdm?.pode_editar || !permissoesDoItemEmFoco?.apenas_leitura)"
          :to="$route.meta?.rotaParaAdição
            ? { name: $route.meta.rotaParaAdição, params: { ano } }
            : `${parentlink}/orcamento/custo/${ano}`"
          class="addlink mt1 mb1"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>
          <span>Adicionar previsão de custo</span>
        </SmaeLink>
        <span
          v-else
          class="addlink disabled mt1 mb1"
        ><svg
           width="20"
           height="20"
         ><use xlink:href="#i_+" /></svg>
          <span>Adicionar previsão de custo</span>
        </span>

        <button
          v-if="!linhasFiltradas?.length && !previstoEhZero[ano] && (activePdm?.pode_editar || !permissoesDoItemEmFoco?.apenas_leitura)"
          type="button"
          class="like-a__text addlink mt1 mb1"
          @click="restringirAZero"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_zero" /></svg>
          <span>informar custo de R$ 0</span>
        </button>
      </div>
    </div>
  </div>
</template>
