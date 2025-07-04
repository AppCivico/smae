<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, inject, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';
import LinhaRealizado from '@/components/orcamento/LinhaRealizado.vue';
import formataValor from '@/helpers/formataValor';
import { useAlertStore } from '@/stores/alert.store';
import { useObrasStore } from '@/stores/obras.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { usePdMStore } from '@/stores/pdm.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import FiltroPorOrgaoEUnidade from './FiltroPorOrgaoEUnidade.vue';
import agrupaFilhos from './helpers/agrupaFilhos';
import somaItems from './helpers/somaItems';

const route = useRoute();

const gblLimiteDeSeleçãoSimultânea = inject('gblLimiteDeSeleçãoSimultânea');

const emit = defineEmits(['apagar', 'editar']);

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

const ano = props.config.ano_referencia;

const alertStore = useAlertStore();
const OrcamentosStore = useOrcamentosStore();
const { OrcamentoRealizado, OrcamentoRealizadoPermissões } = storeToRefs(OrcamentosStore);

const { activePdm } = storeToRefs(usePdMStore());
const { permissõesDaObraEmFoco } = storeToRefs(useObrasStore());
const { permissõesDoProjetoEmFoco } = storeToRefs(useProjetosStore());

const órgãoEUnidadeSelecionados = ref('');
const linhasSelecionadas = ref([]);

const permissoesDoItemEmFoco = computed(() => (route.params.entidadeMãe === 'obras'
  ? permissõesDaObraEmFoco.value
  : permissõesDoProjetoEmFoco.value));

const linhasFiltradas = computed(() => (Array.isArray(OrcamentoRealizado.value[ano]) && órgãoEUnidadeSelecionados.value !== ''
  ? OrcamentoRealizado.value[ano]
    .filter((x) => x.dotacao?.indexOf(órgãoEUnidadeSelecionados.value) === 0)
  : OrcamentoRealizado.value[ano] || []));

const groups = computed(() => agrupaFilhos(linhasFiltradas.value));

const filhosOrdenados = computed(() => (Array.isArray(linhasFiltradas.value)
  ? [...linhasFiltradas.value]
    .sort((a, b) => (a.meta?.id || 0) - (b.meta?.id || 0)
      || (a.iniciativa?.id || 0) - (b.iniciativa?.id || 0)
      || (a.atividade?.id || 0) - (b.atividade?.id || 0))
  : []));

const limiteDeSeleção = computed(() => (gblLimiteDeSeleçãoSimultânea > 0
  ? Math.min(gblLimiteDeSeleçãoSimultânea, filhosOrdenados.value.length)
  : filhosOrdenados.value.length));

const somasDaMeta = computed(() => (Array.isArray(linhasFiltradas.value)
  ? linhasFiltradas.value.reduce((acc, cur) => {
    if (acc === null) {
      acc = { soma_valor_empenho: 0, soma_valor_liquidado: 0 };
    }

    if (!cur.iniciativa && !cur.atividade) {
      acc.soma_valor_empenho += Number.parseFloat(cur.soma_valor_empenho) || 0;
      acc.soma_valor_liquidado += Number.parseFloat(cur.soma_valor_liquidado) || 0;
    }
    return acc;
  }, null)
  : null));

const somaDasLinhas = computed(() => ({
  soma_valor_empenho: formataValor(somaItems(linhasFiltradas.value, 'soma_valor_empenho')),
  soma_valor_liquidado: formataValor(somaItems(linhasFiltradas.value, 'soma_valor_liquidado')),
}));

const podeExcluirEmLote = computed(() => !!OrcamentoRealizadoPermissões
  .value[ano]?.pode_excluir_lote);

function selecionarTodasAsLinhas() {
  const idsParaSelecionar = [...linhasSelecionadas.value];

  if (linhasSelecionadas.value.length < limiteDeSeleção.value) {
    let i = linhasSelecionadas.value.length;

    while (i < limiteDeSeleção.value) {
      const próximoItemSelecionável = filhosOrdenados.value
        .find((x) => idsParaSelecionar.indexOf(x.id) === -1);
      if (próximoItemSelecionável) {
        idsParaSelecionar.push(próximoItemSelecionável.id);
      }
      i += 1;
    }

    linhasSelecionadas.value = idsParaSelecionar;
  } else {
    linhasSelecionadas.value = [];
  }
}

async function excluirEmLote(ids) {
  const carga = { ids: ids.map((x) => ({ id: x })) };
  let pergunta = 'Deseja mesmo remover esses itens?';
  let mensagem = 'Itens removidos';

  if (ids.length === 1) {
    pergunta = 'Deseja mesmo remover esse item?';
    mensagem = 'Item removido';
  }

  alertStore.confirmAction(pergunta, async () => {
    try {
      if (await OrcamentosStore.deleteOrcamentosRealizadosEmLote(carga)) {
        emit('apagar', ids);
        órgãoEUnidadeSelecionados.value = '';
        linhasSelecionadas.value = [];
        alertStore.success(mensagem);
        await OrcamentosStore.getOrcamentoRealizadoById(route.params.meta_id, route.query.aba);
      }
    } catch (error) {
      alertStore.error(error);
    }
  }, 'Remover');
}

watch(órgãoEUnidadeSelecionados, (novoValor) => {
  if (novoValor) {
    linhasSelecionadas.value = [];
  }
});

</script>
<template>
  <div class="mb2">
    <div>
      <header class="flex spacebetween center">
        <h3 class=" w700 mb0">
          {{ config.ano_referencia }}
        </h3>

        <div
          v-if="activePdm?.pode_editar
            || !permissoesDoItemEmFoco?.apenas_leitura
            || permissoesDoItemEmFoco.sou_responsavel
          "
        >
          <div
            v-if="
              config.execucao_disponivel
                || Array.isArray($route.meta?.rotasParaAdição)
                || permissoesDoItemEmFoco.sou_responsavel
            "
            class="dropbtn"
          >
            <span class="addlink"><svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg> <span>Informar execução orçamentária</span></span>
            <ul class="tl">
              <template v-if="$route.meta?.rotasParaAdição?.length">
                <li
                  v-for="item, i in $route.meta.rotasParaAdição"
                  :key="i"
                >
                  <SmaeLink :to="{ name: item.nome, params: { ano } }">
                    {{ item.texto }}
                  </SmaeLink>
                </li>
              </template>
              <template v-else>
                <li>
                  <SmaeLink
                    :to="{
                      path: `${parentlink}/orcamento/realizado/${ano}/dotacao`,
                      query: $route.query
                    }"
                  >
                    Dotação
                  </SmaeLink>
                </li>
                <li>
                  <SmaeLink
                    :to="{
                      path: `${parentlink}/orcamento/realizado/${ano}/processo`,
                      query: $route.query
                    }"
                  >
                    Processo
                  </SmaeLink>
                </li>
                <li>
                  <SmaeLink
                    :to="{
                      path: `${parentlink}/orcamento/realizado/${ano}/nota`,
                      query: $route.query
                    }"
                  >
                    Nota de empenho
                  </SmaeLink>
                </li>
              </template>
            </ul>
          </div>
          <span
            v-else
            class="addlink disabled mt1 mb1"
          ><svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg> <span>Informar execução orçamentária</span></span>
        </div>
      </header>

      <FiltroPorOrgaoEUnidade
        v-if="OrcamentoRealizado[ano]?.length > 1"
        v-model="órgãoEUnidadeSelecionados"
        :ano="ano"
        :lista="Array.isArray(OrcamentoRealizado[ano])
          ? OrcamentoRealizado[ano]
          : []"
      />

      <div class="tablepreinfo flex center">
        <div class="f2">
          <div class="t12 lh1 w700 mb05">
            Execução orçamentária
          </div>
          <div
            v-if="linhasFiltradas?.length"
            class="t12 lh1 w700"
          >
            <span class="tc300">Empenho:</span>
            {{ somaDasLinhas.soma_valor_empenho }}
            <span class="ml1 tc300">Liquidação:</span>
            {{ somaDasLinhas.soma_valor_liquidado }}
          </div>
        </div>

        <slot
          name="cabeçalho"
          :ano="ano"
        />

        <button
          v-if="podeExcluirEmLote && config?.execucao_disponivel &&
            (activePdm?.pode_editar || !permissoesDoItemEmFoco?.apenas_leitura)"
          type="button"
          class="ml2 btn with-icon bgnone tcprimary p0"
          :disabled="!linhasSelecionadas.length"
          @click="() => excluirEmLote(linhasSelecionadas)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_waste" /></svg>
          excluir
        </button>
      </div>

      <div
        v-if="OrcamentoRealizado[ano]?.loading"
        class="spinner pt1 pr2 pb1 pl1"
      >
        Carregando
      </div>

      <table
        v-if="linhasFiltradas?.length"
        class="tablemain fix no-zebra horizontal-lines"
      >
        <colgroup>
          <col>
          <col>
          <col>
          <col>
          <col v-if="OrcamentoRealizadoPermissões[ano]?.pode_editar">
          <col
            v-if="podeExcluirEmLote && config?.execucao_disponivel"
            class="col--botão-de-ação"
          >
        </colgroup>
        <thead>
          <tr>
            <th style="width: 50%">
              Dotação / Processo / Nota
            </th>
            <th>Empenho</th>
            <th>Liquidação</th>
            <th>Atualizado em</th>
            <th
              v-if="OrcamentoRealizadoPermissões[ano]?.pode_editar"
              style="width: 50px"
            />
            <th v-if="podeExcluirEmLote && config?.execucao_disponivel">
              <input
                type="checkbox"
                class="like-a__text"
                :indeterminate.prop="linhasSelecionadas.length
                  && linhasSelecionadas.length !== limiteDeSeleção"
                :checked="linhasSelecionadas.length
                  && linhasSelecionadas.length === limiteDeSeleção"
                :disabled="!filhosOrdenados.length"
                :aria-label="gblLimiteDeSeleçãoSimultânea
                  ? `Selecionar ${gblLimiteDeSeleçãoSimultânea - linhasSelecionadas.length} itens`
                  : 'Selecionar tudo'"
                :title="gblLimiteDeSeleçãoSimultânea
                  ? `Selecionar ${gblLimiteDeSeleçãoSimultânea - linhasSelecionadas.length} itens`
                  : 'Selecionar tudo'"
                @change="selecionarTodasAsLinhas"
              >
            </th>
          </tr>
        </thead>
        <template v-if="groups">
          <tbody>
            <tr>
              <template v-if="somasDaMeta">
                <th class="tc600 w700 pl1">
                  {{ $props.etiquetaDosTotais }}
                </th>
                <td class="w700">
                  {{ somasDaMeta.soma_valor_empenho
                    ? formataValor(somasDaMeta.soma_valor_empenho)
                    : '-' }}
                </td>
                <td class="w700">
                  {{ somasDaMeta.soma_valor_liquidado
                    ? formataValor(somasDaMeta.soma_valor_liquidado)
                    : '-' }}
                </td>
              </template>
              <td
                v-else
                colspan="3"
              />
              <td />
              <td v-if="OrcamentoRealizadoPermissões[ano]?.pode_editar" />
              <td v-if="podeExcluirEmLote && config?.execucao_disponivel" />
            </tr>
            <LinhaRealizado
              v-model="linhasSelecionadas"
              :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
              :group="groups"
              :permissao="config.execucao_disponivel
                && (
                  !permissoesDoItemEmFoco?.apenas_leitura
                  || permissoesDoItemEmFoco?.sou_responsavel
                )
              "
              :exibir-checkbox-de-seleção="podeExcluirEmLote && config?.execucao_disponivel"
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
                  <span class="flex center"><svg
                    class="arrow f0 mr1"
                    width="8"
                    height="13"
                  ><use xlink:href="#i_right" /></svg><span>{{ g.label }}</span></span>
                </td>
                <td class="w700">
                  {{ g.items.length
                    ? formataValor(g.items.reduce((red, x) => red + Number(x.soma_valor_empenho), 0))
                    : '-' }}
                </td>
                <td class="w700">
                  {{ g.items.length
                    ? formataValor(g.items.reduce((red, x) => red + Number(x.soma_valor_liquidado), 0))
                    : '-' }}
                </td>
                <td />
                <td v-if="OrcamentoRealizadoPermissões[ano]?.pode_editar" />
                <td v-if="podeExcluirEmLote && config?.execucao_disponivel" />
              </tr>
              <LinhaRealizado
                v-model="linhasSelecionadas"
                :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
                :group="g"
                :permissao="config.execucao_disponivel
                  && (
                    !permissoesDoItemEmFoco?.apenas_leitura
                    || permissoesDoItemEmFoco?.sou_responsavel
                  )
                "
                :exibir-checkbox-de-seleção="podeExcluirEmLote && config?.execucao_disponivel"
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
                    <span class="flex center"><svg
                      class="arrow f0 mr1"
                      width="8"
                      height="13"
                    ><use xlink:href="#i_right" /></svg><svg
                      class="arrow f0 mr1"
                      width="8"
                      height="13"
                    ><use xlink:href="#i_right" /></svg><span>{{ gg.label }}</span></span>
                  </td>
                  <td class="w700">
                    {{ gg.items.length
                      ? formataValor(gg.items.reduce((red, x) => red + Number(x.soma_valor_empenho), 0))
                      : '-' }}
                  </td>
                  <td class="w700">
                    {{ gg.items.length
                      ? formataValor(gg.items.reduce((red, x) => red + Number(x.soma_valor_liquidado), 0))
                      : '-' }}
                  </td>
                  <td />
                  <td v-if="OrcamentoRealizadoPermissões[ano]?.pode_editar" />
                  <td v-if="podeExcluirEmLote && config?.execucao_disponivel" />
                </tr>
                <LinhaRealizado
                  v-model="linhasSelecionadas"
                  :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
                  :group="gg"
                  :permissao="config.execucao_disponivel
                    && (
                      !permissoesDoItemEmFoco?.apenas_leitura
                      || permissoesDoItemEmFoco?.sou_responsavel
                    )
                  "
                  :exibir-checkbox-de-seleção="podeExcluirEmLote && config?.execucao_disponivel"
                  :parentlink="parentlink"
                />
              </tbody>
            </template>
          </template>
        </template>
      </table>
    </div>
  </div>
</template>
