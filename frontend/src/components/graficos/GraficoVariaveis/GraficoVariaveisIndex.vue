<template>
  <article
    class="board_variavel mb2"
    :aria-busy="haChamadasPendentes"
  >
    <header class="p1">
      <div class="flex center g2">
        <div class="flex center f1">
          <svg
            width="28"
            height="28"
          ><use xlink:href="#grafico" /></svg>

          <h2 class="mt1 mb1 ml1 f1">
            {{ variavel.codigo }} - {{ variavel.titulo }}
          </h2>

          <div
            v-if="variavel.suspendida && variavel.suspendida_em"
            class="tipinfo left"
          >
            <svg
              width="24"
              height="24"
              color="#F2890D"
            ><use xlink:href="#i_alert" /></svg>

            <div>
              Suspensa do monitoramento físico em {{ dateToField(variavel.suspendida_em) }}
            </div>
          </div>
        </div>
      </div>

      <LoadingComponent v-if="haChamadasPendentes" />

      <GraficoHeatmapVariavelCategorica
        v-else-if="variavel.variavel_categorica_id > 0"
        :valores="Valores[(variavel.id as keyof {})]"
      />

      <GraficoLinhasEvolucao
        v-else
        :valores="Valores[(variavel.id as keyof {})]"
      />
    </header>

    <section>
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

      <VariaveisSeries
        :g="Valores[(variavel.id as keyof {})]"
        :informacao-variavel="Valores[(variavel.id as keyof {})]"
        :variavel="true"
        :tem-variavel-acumulada="!!variavel.acumulativa"
      />
    </section>
  </article>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import type { VariavelItemDto } from '@back/variavel/entities/variavel.entity';
import GraficoLinhasEvolucao from '@/components/GraficoLinhasEvolucao.vue';
import GraficoHeatmapVariavelCategorica from '@/components/GraficoHeatmapVariavelCategorica.vue';
import dateToField from '@/helpers/dateToField';
import { useVariaveisStore } from '@/stores/variaveis.store';
import VariaveisSeries from './partials/VariaveisSeries.vue';

type Props = {
  variavel: VariavelItemDto,
};

const props = defineProps<Props>();

const VariaveisStore = useVariaveisStore();
const { Valores } = storeToRefs(VariaveisStore);

const haChamadasPendentes = ref(false);

watch(() => props.variavel.id, async () => {
  if (props.variavel.id) {
    try {
      haChamadasPendentes.value = true;

      await VariaveisStore.getValores(props.variavel.id, { leitura: true });
    } finally {
      haChamadasPendentes.value = false;
    }
  }
}, { immediate: true });
</script>
