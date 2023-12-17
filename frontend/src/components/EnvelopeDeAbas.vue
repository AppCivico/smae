<script setup>
import { kebabCase } from 'lodash';
import { computed, useSlots } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const slots = useSlots();

const props = defineProps({
  metaDadosPorId: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const abaCorrente = computed(() => route.hash.replace('#', ''));
const dadosConsolidadosPorId = computed(() => Object.keys(slots).reduce((acc, cur) => {
  acc[cur] = {
    aberta: props.metaDadosPorId?.[cur]?.aberta,
    etiqueta: props.metaDadosPorId?.[cur]?.etiqueta || cur,
    hash: props.metaDadosPorId?.[cur]?.hash || kebabCase(cur),
    id: props.metaDadosPorId?.[cur]?.id
      || props.metaDadosPorId?.[cur]?.hash
      || kebabCase(cur),
  };
  return acc;
}, {}));

function iniciar() {
  const idDaAbaPadrão = Object.keys(slots).find((x) => dadosConsolidadosPorId.value[x]?.aberta);
  const dadosDaAbaPadrão = dadosConsolidadosPorId.value[idDaAbaPadrão];

  const abaHash = dadosDaAbaPadrão?.hash
    || dadosDaAbaPadrão?.id
    || kebabCase(Object.keys(slots)[0]);

  if (abaHash && !abaCorrente.value) {
    router.replace({
      hash: `#${abaHash}`,
    });
  }
}

iniciar();
</script>
<template>
  <div class="abas">
    <nav class="abas__navegação mb3">
      <ul class="abas__lista flex">
        <li
          v-for="nomeDaAba in Object.keys(slots)"
          :key="kebabCase(nomeDaAba)"
          class="pt1 pb1"
        >
          <router-link
            class="like-a__link t24 w700"
            :class="{
              tc300: abaCorrente !== dadosConsolidadosPorId[nomeDaAba].hash
            }"
            :to="{
              hash: `#${dadosConsolidadosPorId[nomeDaAba].hash}`
            }"
          >
            {{ dadosConsolidadosPorId[nomeDaAba].etiqueta }}
          </router-link>
        </li>
      </ul>
    </nav>

    <div
      v-for="(_slot, nomeDaAba, i) in slots"
      v-show="(!abaCorrente && i === 0) || (abaCorrente === dadosConsolidadosPorId[nomeDaAba].hash)"
      :id="dadosConsolidadosPorId[nomeDaAba].id"
      :key="nomeDaAba"
      class="abas__conteúdo"
    >
      <slot
        :name="nomeDaAba"
        :é-corrente="abaCorrente === dadosConsolidadosPorId[nomeDaAba].hash"
      />
    </div>
  </div>
</template>
<style lang="less">
.abas__navegação {}

.abas__lista {
  > li {
    padding-right: 2rem;
    display: flex;
    align-items: center;
  }

  > li + li {
    border-left: 1px solid @c400;
    padding-left: 2rem;
  }
}
</style>
