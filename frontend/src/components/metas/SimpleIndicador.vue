<script setup>
import { default as EvolucaoGraph } from '@/components/EvolucaoGraph.vue';
import rolarTelaPara from '@/helpers/rolarTelaPara.ts';
import { useAuthStore } from '@/stores/auth.store';
import { useIndicadoresStore } from '@/stores/indicadores.store';
import { storeToRefs } from 'pinia';
import { nextTick } from 'vue';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const props = defineProps(['group', 'parentlink', 'parent_id', 'parent_field']);

const IndicadoresStore = useIndicadoresStore();
const { tempIndicadores, ValoresInd } = storeToRefs(IndicadoresStore);

(async () => {
  if (!tempIndicadores.value.length
    || tempIndicadores.value[0][props.parent_field] != props.parent_id
  ) {
    await IndicadoresStore.filterIndicadores(props.parent_id, props.parent_field);
  }
  if (tempIndicadores.value[0]?.id) {
    await IndicadoresStore.getValores(tempIndicadores.value[0]?.id);
  }

  nextTick().then(() => {
    rolarTelaPara();
  });
})();
</script>
<template>
  <template v-if="tempIndicadores.length">
    <div class="t12 uc w700 mb05 tc300 mb1">
      Indicador
    </div>

    <div
      v-for="ind in tempIndicadores"
      :key="ind.id"
      style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;"
    >
      <div class="p1">
        <div class="flex center g2">
          <SmaeLink
            :to="`${parentlink}/evolucao`"
            class="flex center f1 g2"
          >
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
              {{ ind.titulo }}
            </h2>
          </SmaeLink>
          <SmaeLink
            v-if="perm?.CadastroIndicador?.editar"
            :to="`${parentlink}/indicadores/${ind.id}`"
            title="Editar indicador"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
        </div>
        <EvolucaoGraph :dataserie="ValoresInd[ind.id]" />
        <div class="tc">
          <SmaeLink
            :to="`${parentlink}/evolucao`"
            class="btn big mt1 mb1"
          >
            <span>Acompanhar evolução</span>
          </SmaeLink>
        </div>
      </div>
    </div>
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
      v-if="perm?.CadastroIndicador?.inserir"
      class="bgc50"
    >
      <div class="tc">
        <SmaeLink
          :to="`${parentlink}/indicadores/novo`"
          class="btn mt1 mb1"
        >
          <span>Adicionar indicador</span>
        </SmaeLink>
      </div>
    </div>
  </div>
</template>
