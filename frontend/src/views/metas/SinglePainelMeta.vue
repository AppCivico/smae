<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { default as EvolucaoGraphComparison } from '@/components/EvolucaoGraphComparison.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { useAuthStore, useMetasStore, usePaineisStore } from '@/stores';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const { meta_id } = route.params;

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
if (meta_id && singleMeta.value.id != meta_id) MetasStore.getById(meta_id);
if (meta_id && !activePdm.value.id) MetasStore.getPdM();

const PaineisStore = usePaineisStore();
const { tempPaineis, SingleSerie } = storeToRefs(PaineisStore);
PaineisStore.clear();
const SelectedPainel = ref(0);
const CurrentPainel = ref({});
const ModeloSerie = ref([]);

const iP = ref(-1);
const iR = ref(-1);
const iPA = ref(-1);
const iRA = ref(-1);

(async () => {
  await PaineisStore.getByMeta(meta_id);
  selectPainel();
})();
async function selectPainel() {
  if (!SelectedPainel.value && tempPaineis.value.length) {
    SelectedPainel.value = tempPaineis.value[0].id;
  }
  CurrentPainel.value = tempPaineis.value.find((x) => x.id == SelectedPainel.value);
  SingleSerie.value = {};
  if (CurrentPainel.value.id) {
    const i = CurrentPainel.value.painel_conteudo.find((x) => x.meta_id == meta_id);
    await PaineisStore.getSerieMeta(SelectedPainel.value, i.id);

    iP.value = SingleSerie.value.ordem_series?.indexOf('Previsto');
    iR.value = SingleSerie.value.ordem_series?.indexOf('Realizado');
    iPA.value = SingleSerie.value.ordem_series?.indexOf('PrevistoAcumulado');
    iRA.value = SingleSerie.value.ordem_series?.indexOf('RealizadoAcumulado');

    if (SingleSerie.value?.meta?.indicador?.series?.length) {
      ModeloSerie.value = SingleSerie.value.meta.indicador.series;
    } else if (SingleSerie.value?.detalhes[0]?.series?.length) {
      ModeloSerie.value = SingleSerie.value.detalhes[0].series;
    }
  }
}

// Tables
const tableScroll = ref(null);
let pos = {
  top: 0, left: 0, x: 0, y: 0,
};
let draggin = false;
const mouseDownHandler = function (e) {
  tableScroll.value.style.cursor = 'grabbing';
  tableScroll.value.style.userSelect = 'none';
  pos = {
    left: tableScroll.value.scrollLeft,
    top: tableScroll.value.scrollTop,
    x: e.clientX,
    y: e.clientY,
  };
  draggin = true;
};
const mouseMoveHandler = function (e) {
  if (draggin) {
    const dx = e.clientX - pos.x;
    const dy = e.clientY - pos.y;
    tableScroll.value.scrollTop = pos.top - dy;
    tableScroll.value.scrollLeft = pos.left - dx;
  }
};
const mouseUpHandler = function (e) {
  tableScroll.value.style.cursor = 'grab';
  tableScroll.value.style.removeProperty('user-select');
  draggin = false;
};
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo mb1">
        Meta
      </div>
      <TítuloDePágina
        :ícone="activePdm?.logo"
      >
        {{ singleMeta.titulo }}
      </TítuloDePágina>
    </div>
    <hr class="ml2 f1">
    <SmaeLink
      v-if="temPermissãoPara([
        'CadastroMeta.administrador_no_pdm',
        'CadastroMetaPS.administrador_no_pdm',
        'CadastroMetaPDM.administrador_no_pdm'
      ])"
      :to="`/metas/editar/${singleMeta.id}`"
      class="btn big ml2"
    >
      Editar
    </SmaeLink>
  </div>

  <div class="boards">
    <template v-if="singleMeta.id">
      <template v-if="tempPaineis.length">
        <div class="label tc300">
          Visualizar por
        </div>
        <select
          v-model="SelectedPainel"
          style="width: 250px"
          class="inputtext light mb2"
          @change="selectPainel"
        >
          <option
            v-for="p in tempPaineis"
            :key="p.id"
            :value="p.id"
          >
            {{ p.nome }}
          </option>
        </select>

        <div>
          <EvolucaoGraphComparison
            :single="SingleSerie"
            :dataserie="[SingleSerie.meta?.indicador].concat(SingleSerie?.detalhes?.filter(x => x?.iniciativa?.id)?.map(x => x.iniciativa.indicador[0]))"
          />
        </div>

        <div
          ref="tableScroll"
          class="evolucaoTable"
          @mousedown="mouseDownHandler"
          @mousemove="mouseMoveHandler"
          @mouseup="mouseUpHandler"
        >
          <div
            class="flex header bb"
            :style="{ width: ((ModeloSerie.length + 1) * 400) + 'px' }"
          >
            <div class="flex center p1 f0 g1 stickyleft br">
              <svg
                class="f0"
                style="flex-basis: 2rem;"
                width="28"
                height="28"
                viewBox="0 0 28 28"
                color="#F2890D"
                xmlns="http://www.w3.org/2000/svg"
              ><use xlink:href="#i_indicador" /></svg>
              <h2 class="mt1 mb1">
                Evolução
              </h2>
            </div>
            <div
              v-for="v, k in ModeloSerie"
              :key="k"
              class="f0 end br"
              style="flex-basis:400px;"
            >
              <div class="t14 w700 p05">
                {{ v.titulo }}
              </div>
              <div class="flex">
                <div class="f1 label p05 tc200 br">
                  Previsto mensal
                </div>
                <div class="f1 label p05 tc200 br">
                  Realizado mensal
                </div>
                <div class="f1 label p05 tc200 br">
                  Previsto acumulado
                </div>
                <div class="f1 label p05 tc200">
                  Realizado acumulado
                </div>
              </div>
            </div>
          </div>

          <template v-if="SingleSerie?.meta?.indicador">
            <div
              v-for="ind in [SingleSerie.meta.indicador]"
              :key="ind.id"
              class="flex center"
              :style="{ width: ((ModeloSerie.length + 1) * 400) + 'px' }"
            >
              <div class="flex center br p05 f0 g1 t14 w700 stickyleft">
                {{ ind.codigo }} {{ ind.titulo }}
              </div>
              <div
                v-for="v, k in ind.series"
                :key="k"
                class="f0 flex"
                style="flex-basis:400px;"
              >
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iP] ?? '-' }}
                </div>
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iR] ?? '-' }}
                </div>
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iPA] ?? '-' }}
                </div>
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iRA] ?? '-' }}
                </div>
              </div>
            </div>
          </template>

          <div
            v-for="ind in SingleSerie?.detalhes?.filter(x => x?.variavel?.id)"
            :key="ind.id"
            class="flex center"
            :style="{ width: ((ModeloSerie.length + 1) * 400) + 'px' }"
          >
            <div class="br p05 f0 g1 t14 pl2 stickyleft">
              {{ ind.variavel?.codigo }} {{ ind.variavel?.titulo }}
            </div>
            <div
              v-for="v, k in ind.variavel?.series"
              :key="k"
              class="f0 flex"
              style="flex-basis:400px;"
            >
              <div class="f1 p05 t14 br">
                {{ v.valores_nominais[iP] ?? '-' }}
              </div>
              <div class="f1 p05 t14 br">
                {{ v.valores_nominais[iR] ?? '-' }}
              </div>
              <div class="f1 p05 t14 br">
                {{ v.valores_nominais[iPA] ?? '-' }}
              </div>
              <div class="f1 p05 t14 br">
                {{ v.valores_nominais[iRA] ?? '-' }}
              </div>
            </div>
          </div>

          <template v-for="ini in SingleSerie?.detalhes?.filter(x => x?.iniciativa?.id)">
            <div
              class="flex center bgc50 bb"
              :style="{ width: ((ModeloSerie.length + 1) * 400) + 'px' }"
            >
              <div class="flex center br p05 pl2 f0 g1 t12 w700 stickyleft bgc50">
                <span class="f0"><svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_valores" /></svg></span>
                <span>{{ ini.iniciativa.codigo }} {{ ini.iniciativa.titulo }}</span>
              </div>
            </div>
            <div
              v-for="ind in ini.iniciativa.indicador"
              :key="ind.id"
              class="flex center"
              :style="{ width: ((ModeloSerie.length + 1) * 400) + 'px' }"
            >
              <div class="flex center br p05 pl2 f0 g1 t14 w700 stickyleft">
                {{ ind.codigo }} {{ ind.titulo }}
              </div>
              <div
                v-for="v, k in ind.series"
                :key="k"
                class="f0 flex"
                style="flex-basis:400px;"
              >
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iP] ?? '-' }}
                </div>
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iR] ?? '-' }}
                </div>
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iPA] ?? '-' }}
                </div>
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iRA] ?? '-' }}
                </div>
              </div>
            </div>

            <div
              v-for="ind in ini.filhos?.filter(x => x?.variavel?.id)"
              :key="ind.id"
              class="flex center"
              :style="{ width: ((ModeloSerie.length + 1) * 400) + 'px' }"
            >
              <div class="br p05 f0 g1 t14 pl2 stickyleft">
                {{ ind.variavel?.codigo }} {{ ind.variavel?.titulo }}
              </div>
              <div
                v-for="v, k in ind.variavel?.series"
                :key="k"
                class="f0 flex"
                style="flex-basis:400px;"
              >
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iP] ?? '-' }}
                </div>
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iR] ?? '-' }}
                </div>
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iPA] ?? '-' }}
                </div>
                <div class="f1 p05 t14 br">
                  {{ v.valores_nominais[iRA] ?? '-' }}
                </div>
              </div>
            </div>

            <template v-for="ati in ini.filhos.filter(x => x?.atividade?.id)">
              <div
                class="flex center bgc50 bb"
                :style="{ width: ((ModeloSerie.length + 1) * 400) + 'px' }"
              >
                <div class="flex center br p05 pl4 f0 g1 t12 w700 stickyleft bgc50">
                  <span class="f0"><svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_valores" /></svg></span>
                  <span>{{ ati.atividade.codigo }} {{ ati.atividade.titulo }}</span>
                </div>
              </div>
              <div
                v-for="ind in ati.atividade.indicador"
                :key="ind.id"
                class="flex center"
                :style="{ width: ((ModeloSerie.length + 1) * 400) + 'px' }"
              >
                <div class="flex center br p05 pl4 f0 g1 t14 w700 stickyleft">
                  {{ ind.codigo }} {{ ind.titulo }}
                </div>
                <div
                  v-for="v, k in ind.series"
                  :key="k"
                  class="f0 flex"
                  style="flex-basis:400px;"
                >
                  <div class="f1 p05 t14 br">
                    {{ v.valores_nominais[iP] ?? '-' }}
                  </div>
                  <div class="f1 p05 t14 br">
                    {{ v.valores_nominais[iR] ?? '-' }}
                  </div>
                  <div class="f1 p05 t14 br">
                    {{ v.valores_nominais[iPA] ?? '-' }}
                  </div>
                  <div class="f1 p05 t14 br">
                    {{ v.valores_nominais[iRA] ?? '-' }}
                  </div>
                </div>
              </div>

              <div
                v-for="ind in ati.filhos?.filter(x => x?.variavel?.id)"
                :key="ind.id"
                class="flex center"
                :style="{ width: ((ModeloSerie.length + 1) * 400) + 'px' }"
              >
                <div class="br p05 f0 g1 t14 pl5 stickyleft">
                  {{ ind.variavel?.codigo }} {{ ind.variavel?.titulo }}
                </div>
                <div
                  v-for="v, k in ind.variavel?.series"
                  :key="k"
                  class="f0 flex"
                  style="flex-basis:400px;"
                >
                  <div class="f1 p05 t14 br">
                    {{ v.valores_nominais[iP] ?? '-' }}
                  </div>
                  <div class="f1 p05 t14 br">
                    {{ v.valores_nominais[iR] ?? '-' }}
                  </div>
                  <div class="f1 p05 t14 br">
                    {{ v.valores_nominais[iPA] ?? '-' }}
                  </div>
                  <div class="f1 p05 t14 br">
                    {{ v.valores_nominais[iRA] ?? '-' }}
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </template>
      <template v-else-if="tempPaineis.loading">
        <div class="p1">
          <span>Carregando</span> <svg
            class="ml1 ib"
            width="20"
            height="20"
          ><use xlink:href="#i_spin" /></svg>
        </div>
      </template>
      <template v-else-if="tempPaineis.error">
        <div class="error p1">
          <p class="error-msg">
            Error: {{ singleMeta.error }}
          </p>
        </div>
      </template>
      <template v-else>
        <div class="error p1">
          <p class="error-msg">
            Nenhum painel encontrado.
          </p>
        </div>
      </template>
    </template>
    <template v-else-if="singleMeta.loading">
      <div class="p1">
        <span>Carregando</span> <svg
          class="ml1 ib"
          width="20"
          height="20"
        ><use xlink:href="#i_spin" /></svg>
      </div>
    </template>
    <template v-else-if="singleMeta.error">
      <div class="error p1">
        <p class="error-msg">
          Error: {{ singleMeta.error }}
        </p>
      </div>
    </template>
    <template v-else>
      <div class="error p1">
        <p class="error-msg">
          Nenhum item encontrado.
        </p>
      </div>
    </template>
  </div>
</template>
<style lang="less">
    @import "@/_less/variables.less";
    .evolucaoTable{
        border: 1px solid @c100; border-top: 8px solid #F2890D;overflow-x:auto;
        .header{
            align-content: stretch;
            .end{display: flex; flex-direction: column; justify-content: flex-end;}
        }
        >div{width: fit-content;}
        .stickyleft{
            flex-basis:400px !important; position: sticky; left:0; z-index: 2; background: white;
            &.bgc50{background: @c50;}
        }
        .label{margin: 0;}
        .bb{border-bottom: 1px solid @c100;}
        .br{border-right: 1px solid @c100;}
    }
</style>
