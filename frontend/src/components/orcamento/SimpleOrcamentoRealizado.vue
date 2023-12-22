<script setup>
import { default as LinhaRealizado } from '@/components/orcamento/LinhaRealizado.vue';
import { useAuthStore } from '@/stores/auth.store';
import formataValor from '@/helpers/formataValor';
import { useAlertStore } from '@/stores/alert.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import agrupaFilhos from './helpers/agrupaFilhos';
import somaItems from './helpers/somaItems';
import FiltroPorOrgaoEUnidade from './FiltroPorOrgaoEUnidade.vue';

const emit = defineEmits(['apagar', 'editar']);

// PRA-FAZER: tornar globalmente disponível. Ver `main.ts`.
const gblLimiteDeSeleçãoSimultânea = Number.parseInt(
  import.meta.env.VITE_LIMITE_SELECAO,
  10,
)
  || undefined;

const props = defineProps(['parentlink', 'config']);
const ano = props.config.ano_referencia;

const alertStore = useAlertStore();
const { temPermissãoPara } = useAuthStore();
const OrcamentosStore = useOrcamentosStore();
const { OrcamentoRealizado, OrcamentoRealizadoConclusão } = storeToRefs(OrcamentosStore);

const órgãoEUnidadeSelecionados = ref('');
const linhasSelecionadas = ref([]);

const groups = computed(() => (Array.isArray(OrcamentoRealizado.value[ano])
  ? agrupaFilhos(OrcamentoRealizado.value[ano])
  : null));

const filhosOrdenados = computed(() => (Array.isArray(OrcamentoRealizado.value[ano])
  ? [...OrcamentoRealizado.value[ano]]
    .sort((a, b) => (a.meta?.id || 0) - (b.meta?.id || 0)
      || (a.iniciativa?.id || 0) - (b.iniciativa?.id || 0)
      || (a.atividade?.id || 0) - (b.atividade?.id || 0))
  : []));

const somasDaMeta = computed(() => (Array.isArray(OrcamentoRealizado.value[ano])
  ? OrcamentoRealizado.value[ano].reduce((acc, cur) => {
    if (!cur.iniciativa && !cur.atividade) {
      acc.soma_valor_empenho += Number.parseFloat(cur.soma_valor_empenho) || 0;
      acc.soma_valor_liquidado += Number.parseFloat(cur.soma_valor_liquidado) || 0;
    }
    return acc;
  }, { soma_valor_empenho: 0, soma_valor_liquidado: 0 })
  : { soma_valor_empenho: 0, soma_valor_liquidado: 0 }));

function selecionarTodasAsLinhas() {
  const idsParaSelecionar = [...linhasSelecionadas.value];
  const limite = gblLimiteDeSeleçãoSimultânea
    ? Math.min(gblLimiteDeSeleçãoSimultânea, filhosOrdenados.value.length)
    : filhosOrdenados.value.length;

  if (linhasSelecionadas.value.length < limite) {
    let i = linhasSelecionadas.value.length;

    while (i < limite) {
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
      <FiltroPorOrgaoEUnidade
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
            v-if="OrcamentoRealizado[ano]?.length"
            class="t12 lh1 w700"
          >
            <span class="tc300">Empenho:</span>
            {{ formataValor(somaItems(OrcamentoRealizado[ano], 'soma_valor_empenho')) }}
            <span class="ml1 tc300">Liquidação:</span>
            {{ formataValor(somaItems(OrcamentoRealizado[ano], 'soma_valor_liquidado')) }}
          </div>
        </div>

        <slot
          name="cabeçalho"
          :ano="ano"
        />

        <button
          v-if="temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])"
          type="button"
          class="ml2 btn bgnone outline"
          :disabled="!linhasSelecionadas.length"
          @click="() => excluirEmLote(linhasSelecionadas)"
        >
          excluir de montão
        </button>
      </div>

      <div
        v-if="OrcamentoRealizado[ano]?.loading"
        class="spinner pt1 pr2 pb1 pl1"
      >
        Carregando
      </div>

      <table
        v-if="config.execucao_disponivel"
        class="tablemain fix no-zebra horizontal-lines"
      >
        <col>
        <col>
        <col>
        <col>
        <col>
        <col
          v-if="temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])"
          class="col--botão-de-ação"
        >
        <thead>
          <tr>
            <th style="width: 50%">
              Dotação / Processo / Nota
            </th>
            <th>Empenho</th>
            <th>Liquidação</th>
            <th>Atualizado em</th>
            <th style="width: 50px" />
            <th v-if="temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])">
              <button
                type="button"
                class="like-a__text"
                :disabled="!filhosOrdenados.length"
                :aria-label="gblLimiteDeSeleçãoSimultânea
                  ? `Selecionar ${gblLimiteDeSeleçãoSimultânea} itens`
                  : 'Selecionar tudo'"
                :title="gblLimiteDeSeleçãoSimultânea
                  ? `Selecionar ${gblLimiteDeSeleçãoSimultânea} itens`
                  : 'Selecionar tudo'"
                @click="selecionarTodasAsLinhas"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_waste" /></svg>
              </button>
            </th>
          </tr>
        </thead>
        <template v-if="groups">
          <tbody>
            <tr>
              <td class="tc600 w700 pl1">
                <strong>Totais da meta</strong>
              </td>
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
              <td />
              <td />
              <td v-if="temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])" />
            </tr>
            <LinhaRealizado
              v-model="linhasSelecionadas"
              :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
              :group="groups"
              :permissao="config.execucao_disponivel"
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
                <td />
                <td v-if="temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])" />
              </tr>
              <LinhaRealizado
                v-model="linhasSelecionadas"
                :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
                :group="g"
                :permissao="config.previsao_custo_disponivel"
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
                  <td />
                  <td v-if="temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])" />
                </tr>
                <LinhaRealizado
                  v-model="linhasSelecionadas"
                  :órgão-e-unidade-selecionados="órgãoEUnidadeSelecionados"
                  :group="gg"
                  :permissao="config.previsao_custo_disponivel"
                  :parentlink="parentlink"
                />
              </tbody>
            </template>
          </template>
        </template>
      </table>
      <div class="flex center justifycenter">
        <div
          v-if="config.execucao_disponivel || Array.isArray($route.meta?.rotasParaAdição)"
          class="ml2 dropbtn"
        >
          <span class="addlink mt1 mb1"><svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg> <span>Informar execução orçamentária</span></span>
          <ul class="tl">
            <template v-if="$route.meta?.rotasParaAdição?.length">
              <li
                v-for="item, i in $route.meta.rotasParaAdição"
                :key="i"
              >
                <router-link :to="{ name: item.nome, params: { ano } }">
                  {{ item.texto }}
                </router-link>
              </li>
            </template>
            <template v-else>
              <li>
                <router-link :to="`${parentlink}/orcamento/realizado/${ano}/dotacao`">
                  Dotação
                </router-link>
              </li>
              <li>
                <router-link :to="`${parentlink}/orcamento/realizado/${ano}/processo`">
                  Processo
                </router-link>
              </li>
              <li>
                <router-link :to="`${parentlink}/orcamento/realizado/${ano}/nota`">
                  Nota de empenho
                </router-link>
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
    </div>
  </div>
</template>
