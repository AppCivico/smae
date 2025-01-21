<script setup>
import EsperarEntrarNaTela from '@/components/EsperarEntrarNaTela.vue';
import EvolucaoGraph from '@/components/EvolucaoGraph.vue';
import OverlayIndisponivel from '@/components/OverlayIndisponivel.vue';
import GraficoHeatmapVariavelCategorica from '@/components/GraficoHeatmapVariavelCategorica.vue';
import EvolucaoDeMetaIniciativaAtividade from '@/components/metas/EvolucaoDeMetaIniciativaAtividade.vue';
import GruposDeSerie from '@/components/metas/GruposDeSerie.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import SmallModal from '@/components/SmallModal.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useIndicadoresStore } from '@/stores/indicadores.store';
import { useMetasStore } from '@/stores/metas.store';
import { useVariaveisStore } from '@/stores/variaveis.store';
import AddEditRealizado from '@/views/metas/AddEditRealizado.vue';
import AddEditValores from '@/views/metas/AddEditValores.vue';
import AddEditVariavel from '@/views/metas/AddEditVariavel.vue';
import { storeToRefs } from 'pinia';
import {
  computed, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const IndicadoresStore = useIndicadoresStore();
const { tempIndicadores, ValoresInd } = storeToRefs(IndicadoresStore);

const VariaveisStore = useVariaveisStore();
const { Variaveis } = storeToRefs(VariaveisStore);

const route = useRoute();
const { meta_id: metaId } = route.params;
const { iniciativa_id: iniciativaId } = route.params;
const { atividade_id: atividadeId } = route.params;

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);
const parentId = computed(() => atividadeId ?? iniciativaId ?? metaId ?? false);
// mantendo comportamento legado
// eslint-disable-next-line no-nested-ternary
const parentField = computed(() => (atividadeId ? 'atividade_id' : iniciativaId ? 'iniciativa_id' : metaId ? 'meta_id' : false));
// mantendo comportamento legado
// eslint-disable-next-line no-nested-ternary
const parentLabel = ref(atividadeId ? '-' : iniciativaId ? '-' : metaId ? 'Meta' : false);

const parentLink = computed(() => {
  let baseLink = '';

  if (metaId) {
    baseLink += `/metas/${metaId}`;
  }

  if (iniciativaId) {
    baseLink += `/iniciativas/${iniciativaId}`;
  }

  if (atividadeId) {
    baseLink += `/atividades/${atividadeId}`;
  }

  return baseLink;
});

const dialogoAtivo = computed(() => {
  switch (route.meta.group) {
    case 'variaveis':
      return AddEditVariavel;
    case 'valores':
      return AddEditValores;
    case 'retroativos':
      return AddEditRealizado;
    default:
      return null;
  }
});

const contagemDeRecarregamentos = ref(0);
const numeroMaximoDeRecarregamentos = ref(2);

async function iniciar(forcarAtualizacao = false) {
  contagemDeRecarregamentos.value += 1;
  await MetasStore.getPdM();
  if (atividadeId) parentLabel.value = activePdm.value.rotulo_atividade;
  else if (iniciativaId) parentLabel.value = activePdm.value.rotulo_iniciativa;
  if (!tempIndicadores.value?.length
    // mantendo comportamento legado
    // eslint-disable-next-line eqeqeq, max-len
    || tempIndicadores.value?.[0]?.[parentField.value] != parentId.value
    || forcarAtualizacao
  ) {
    await IndicadoresStore.filterIndicadores(parentId.value, parentField.value);
  }
  if (tempIndicadores.value[0]?.id) {
    IndicadoresStore.getValores(tempIndicadores.value[0]?.id);
    await VariaveisStore.getAll(tempIndicadores.value[0]?.id);
  }
}

watch([parentId, parentField], iniciar, { immediate: true });
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo mb1">
        {{ parentLabel }}
      </div>

      <TítuloDePágina
        :ícone="activePdm?.logo"
      >
        Evolução da {{ parentLabel }}
      </TítuloDePágina>
    </div>
    <hr class="ml2 f1">
  </div>

  <div class="boards">
    <template v-if="tempIndicadores.length">
      <template
        v-for="ind in tempIndicadores"
        :key="ind.id"
      >
        <div class="board_indicador mb2">
          <header class="p1">
            <div class="flex center g2">
              <div class="flex center f1">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  color="#F2890D"
                  class="f0"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M24.9091 0.36377H3.09091C2.36759 0.36377 1.6739 0.651104
                    1.16244 1.16257C0.650975 1.67403 0.36364 2.36772 0.36364
                    3.09104V24.9092C0.36364 25.6325 0.650975 26.3262 1.16244
                    26.8377C1.6739 27.3492 2.36759 27.6365 3.09091
                    27.6365H24.9091C25.6324 27.6365 26.3261 27.3492 26.8376
                    26.8377C27.349 26.3262 27.6364 25.6325 27.6364
                    24.9092V3.09104C27.6364 2.36772 27.349 1.67403 26.8376
                    1.16257C26.3261 0.651104 25.6324 0.36377 24.9091
                    0.36377ZM24.9091 3.09104V8.54559H24.3636L22.1818
                    10.7274L16.5909 5.1365L11.1364 11.9547L7.18182 8.00012L3.90909
                    11.2729H3.09091V3.09104H24.9091ZM3.09091
                    24.9092V14.0001H5L7.18182 11.8183L11.4091 16.0456L16.8636
                    9.22741L22.1818 14.5456L25.5909
                    11.2729H24.9091V24.9092H3.09091Z"
                    fill="currentColor"
                  /> <path
                    d="M7.18182 19.4547H4.45455V23.5456H7.18182V19.4547Z"
                    fill="currentColor"
                  /> <path
                    d="M12.6364 18.091H9.90909V23.5456H12.6364V18.091Z"
                    fill="currentColor"
                  /> <path
                    d="M18.0909 15.3638H15.3636V23.5456H18.0909V15.3638Z"
                    fill="currentColor"
                  /> <path
                    d="M23.5455 18.091H20.8182V23.5456H23.5455V18.091Z"
                    fill="currentColor"
                  /> </svg>
                <h2 class="mt1 mb1 ml1">
                  {{ ind.codigo }} - {{ ind.titulo }}
                </h2>
              </div>
              <div class="f0 ml2">
                <!-- <select class="inputtext">
                      <option>Até mês corrente</option>
                      <option>Mês corrente</option>
                      <option>Todo período</option>
                      <option>Meses futuros</option>
                  </select> -->
              </div>
              <SmaeLink
                v-if="temPermissãoPara([
                  'CadastroMeta.administrador_no_pdm',
                  'CadastroMetaPS.administrador_no_pdm'
                ])"
                :to="`${parentLink}/indicadores/${ind.id}`"
                class="tprimary"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </SmaeLink>
            </div>
            <div class="relative">
              <GraficoHeatmapVariavelCategorica
                v-if="ValoresInd[ind.id]?.variavel?.variavel_categorica_id"
                :valores="ValoresInd[ind.id]"
              />
              <EvolucaoGraph
                v-else
                :dataserie="ValoresInd[ind.id]"
                :casas-decimais="ind.casas_decimais"
              />
              <OverlayIndisponivel
                v-if="ind.recalculando"
                :tem-tentar-novamente="true"
                :texto-descritivo="ind.recalculo_erro"
                :tentar-novamente-em="contagemDeRecarregamentos >= numeroMaximoDeRecarregamentos
                  ? null
                  : ind.recalculo_tempo "
                @recarregar-dados="iniciar(true)"
              />
            </div>
          </header>
          <div>
            <div class="tablepreinfo">
              <div class="flex spacebetween">
                <div class="flex center">
                  <div class="t12 lh1 w700 uc tc400">
                    Previsto X Realizado
                  </div>
                  <div class="tipinfo ml1">
                    <svg
                      width="20"
                      height="20"
                    ><use xlink:href="#i_i" /></svg><div>
                      Indicador calculado pela média móvel das variáveis
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <table class="tablemain">
              <thead>
                <tr>
                  <th style="width: 25%">
                    Mês/Ano
                  </th>
                  <th style="width: 17.5%">
                    Previsto Mensal
                  </th>
                  <th style="width: 17.5%">
                    Realizado Mensal
                  </th>
                  <th style="width: 17.5%">
                    Previsto Acumulado
                  </th>
                  <th style="width: 17.5%">
                    Realizado Acumulado
                  </th>
                  <th style="width: 5%" />
                </tr>
              </thead>
              <GruposDeSerie :g="ValoresInd[ind.id]" />
            </table>
          </div>
        </div>

        <div class="t12 uc w700 mb05 tc300">
          Variáveis
        </div>
        <hr class="mb2">

        <template v-if="!Variaveis[ind.id]?.loading">
          <EsperarEntrarNaTela
            v-for="v in Variaveis[ind.id]"
            :key="v.id"
          >
            <EvolucaoDeMetaIniciativaAtividade
              :variavel="v"
              :parent-link="parentLink"
              :indicador="ind"
            />
          </EsperarEntrarNaTela>
        </template>

        <div
          v-else
          class="p1"
        >
          <span>Carregando</span> <svg
            class="ml1 ib"
            width="20"
            height="20"
          ><use xlink:href="#i_spin" /></svg>
        </div>
      </template>
    </template>
    <div
      v-if="!tempIndicadores.length && !tempIndicadores.loading"
      style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;"
    >
      <div class="p1">
        <h2 class="mt1 mb1">
          Evolução
        </h2>
      </div>
      <div
        v-if="temPermissãoPara([
          'CadastroMeta.administrador_no_pdm',
          'CadastroMetaPS.administrador_no_pdm'
        ])"
        class="bgc50"
      >
        <div class="tc">
          <SmaeLink
            :to="`${parentLink}/indicadores/novo`"
            class="btn mt1 mb1"
          >
            <span>Adicionar indicador</span>
          </SmaeLink>
        </div>
      </div>
    </div>
  </div>

  <SmallModal
    v-if="dialogoAtivo"
  >
    <component
      :is="dialogoAtivo"
    />
  </SmallModal>
</template>
