<script setup>
import { kebabCase } from 'lodash';
import { computed, useSlots } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const slots = useSlots();

const props = defineProps({
  nomeDaChaveDeAbas: {
    type: String,
    default: 'aba',
  },
  nomeDaRotaRaiz: {
    type: String,
    default: '',
  },
  metaDadosPorId: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});
// PRA-FAZER: um registro secundário da aba aberta em paralelo à query na rota
// para cobrir todas as bases. Infelizmente, não adiantará muito enquanto houver
// chaves de rota no componente raiz. Ver `App.vue`.
const abaAberta = computed(() => route.query[props.nomeDaChaveDeAbas]);
const dadosConsolidadosPorId = computed(() => Object.keys(slots).reduce((acc, cur) => {
  acc[cur] = {
    aberta: props.metaDadosPorId?.[cur]?.aberta,
    etiqueta: props.metaDadosPorId?.[cur]?.etiqueta || cur,
    hash: props.metaDadosPorId?.[cur]?.hash
      || props.metaDadosPorId?.[cur]?.id
      || kebabCase(cur),
    id: props.metaDadosPorId?.[cur]?.id
      || props.metaDadosPorId?.[cur]?.hash
      || kebabCase(cur),
  };
  return acc;
}, {}));

function iniciar() {
  const idDaAbaPadrão = Object.keys(slots).find((x) => dadosConsolidadosPorId.value[x]?.aberta);
  const dadosDaAbaPadrão = dadosConsolidadosPorId.value[idDaAbaPadrão];

  const hashDaAbaPadrão = dadosDaAbaPadrão?.hash
    || dadosDaAbaPadrão?.id;
  // PRA-FAZER: conferir se um hash correspondente
  // a uma aba inexistente está em uso
  if (hashDaAbaPadrão && !abaAberta.value) {
    router.replace({
      name: props.nomeDaRotaRaiz || route.meta.rotaDeEscape || route.name,
      params: route.params,
      query: {
        ...route.query,
        [props.nomeDaChaveDeAbas]: hashDaAbaPadrão,
      },
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
            class="abas__link like-a__link t20 w700"
            :class="{
              tc300: abaAberta !== dadosConsolidadosPorId[nomeDaAba].hash
            }"
            :to="{
              name: nomeDaRotaRaiz || $route.meta.rotaDeEscape || $route.name,
              params: $route.params,
              query: {
                ...$route.query,
                [nomeDaChaveDeAbas]: dadosConsolidadosPorId[nomeDaAba].hash,
              }
            }"
            :aria-current="abaAberta === dadosConsolidadosPorId[nomeDaAba].hash
              ? 'page'
              : undefined"
          >
            {{ dadosConsolidadosPorId[nomeDaAba].etiqueta }}
          </router-link>
        </li>
      </ul>
    </nav>

    <Transition
      v-for="(_slot, nomeDaAba, i) in slots"
      :key="nomeDaAba"
      appear
      name="slide"
    >
      <div
        v-show="(!abaAberta && i === 0) || (abaAberta === dadosConsolidadosPorId[nomeDaAba].hash)"
        :id="dadosConsolidadosPorId[nomeDaAba].id"
        class="abas__conteúdo"
      >
        <slot
          :name="nomeDaAba"
          :está-aberta="abaAberta === dadosConsolidadosPorId[nomeDaAba].hash"
        />
      </div>
    </Transition>
  </div>
</template>
<style lang="less">
.abas__navegação {
  max-width: max-content;
  margin-left: auto;
  margin-right: auto;
  text-transform: uppercase;
}

.abas__lista {
  > li {
    padding-right: 2rem;
    display: flex;
    align-items: center;
    flex-basis: 0;
    flex-grow: 1;
    min-width: 0;
    text-wrap: balance;
    max-width: max-content;
  }

  > li + li {
    border-left: 1px solid @c400;
    padding-left: 2rem;
  }
}

.abas__link {
  text-overflow: ellipsis;
  display: block;
  min-width: 0;
  overflow: hidden;
}
</style>
