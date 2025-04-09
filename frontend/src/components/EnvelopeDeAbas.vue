<script setup>
import { useResizeObserver } from '@vueuse/core';
import { debounce, kebabCase } from 'lodash';
import {
  computed, nextTick, ref, useSlots,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const slots = useSlots();

const props = defineProps({
  alinhamento: {
    type: String,
    default: 'centro',
    validator(valor) {
      return [
        'centro',
        'direita',
        'esquerda',
      ].indexOf(valor) > -1;
    },
  },
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

const listaDeAbas = ref(null);

const abas = computed(() => Object.keys(slots).filter((x) => !x.includes('__cabecalho')));

// PRA-FAZER: um registro secundário da aba aberta em paralelo à query na rota
// para cobrir todas as bases. Infelizmente, não adiantará muito enquanto houver
// chaves de rota no componente raiz. Ver `App.vue`.
const abaAberta = computed(() => route.query[props.nomeDaChaveDeAbas]);
const dadosConsolidadosPorId = computed(() => Object.keys(props.metaDadosPorId)
  .reduce((acc, cur) => {
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

async function rolarParaAbaCorrente() {
  if (listaDeAbas.value) {
    await nextTick();
    const indiceDaAbaCorrente = Array.from(listaDeAbas.value.querySelectorAll('a'))
      .findIndex((x) => x.hasAttribute('aria-current'));
    const { children: filhas } = listaDeAbas.value;

    if (filhas[indiceDaAbaCorrente]) {
      listaDeAbas.value.scrollLeft = filhas[indiceDaAbaCorrente].offsetLeft;
    }
  }
}

async function iniciar() {
  const idDaAbaPadrao = Object.keys(slots).find((x) => dadosConsolidadosPorId.value[x]?.aberta);
  const dadosDaAbaPadrão = dadosConsolidadosPorId.value[idDaAbaPadrao];

  const hashDaAbaPadrao = dadosDaAbaPadrão?.hash
    || dadosDaAbaPadrão?.id
    || abas.value?.[0];

  if (props.metaDadosPorId) {
    console.warn('O uso de `metaDadosPorId` é obsoleto. Utilize slots com o sufixo `__cabecalho` em seus nomes.');
  }

  if (hashDaAbaPadrao && !abaAberta.value) {
    router.replace({
      name: props.nomeDaRotaRaiz || route.name,
      params: route.params,
      query: Object.assign(
        structuredClone(route.query),
        {
          [props.nomeDaChaveDeAbas]: hashDaAbaPadrao,
        },
      ),
    });
  }
  await nextTick();
  rolarParaAbaCorrente();
}

useResizeObserver(listaDeAbas, debounce(async () => {
  await nextTick();
  rolarParaAbaCorrente();
}, 400));

iniciar();
</script>
<template>
  <div class="abas">
    <nav
      class="abas__navegacao mb3"
      :class="`abas__navegacao--${alinhamento}`"
    >
      <ul
        ref="listaDeAbas"
        class="abas__lista flex"
      >
        <li
          v-for="nomeDaAba in abas"
          :key="nomeDaAba"
          class="pt1 pb1"
        >
          <router-link
            class="abas__link like-a__link t16 w700"
            :class="{
              tc300: abaAberta !== (dadosConsolidadosPorId?.[nomeDaAba]?.hash || nomeDaAba)
            }"
            :to="{
              name: nomeDaRotaRaiz || $route.name,
              params: $route.params,
              query: {
                ...$route.query,
                [nomeDaChaveDeAbas]: dadosConsolidadosPorId?.[nomeDaAba]?.hash || nomeDaAba,
              }
            }"
            :aria-current="abaAberta === (dadosConsolidadosPorId?.[nomeDaAba]?.hash || nomeDaAba)
              ? 'page'
              : undefined"
          >
            <slot :name="`${nomeDaAba}__cabecalho`">
              {{ dadosConsolidadosPorId?.[nomeDaAba]?.etiqueta || nomeDaAba }}
            </slot>
          </router-link>
        </li>
      </ul>
    </nav>

    <Transition
      v-for="nomeDaAba in abas"
      :key="nomeDaAba"
      appear
      name="slide"
    >
      <div
        v-show="String(abaAberta) === (dadosConsolidadosPorId?.[nomeDaAba]?.hash || nomeDaAba)"
        :id="dadosConsolidadosPorId?.[nomeDaAba]?.id || nomeDaAba"
        class="abas__conteudo"
      >
        <slot
          :name="nomeDaAba"
          :está-aberta="abaAberta === (dadosConsolidadosPorId?.[nomeDaAba]?.hash || nomeDaAba)"
          :aba-esta-aberta="abaAberta === (dadosConsolidadosPorId?.[nomeDaAba]?.hash || nomeDaAba)"
        />
      </div>
    </Transition>
  </div>
</template>
<style lang="less">
.abas__navegacao {
  max-width: max-content;
  margin-left: auto;
  margin-right: auto;
}

.abas__navegacao--esquerda {
  margin-left: 0;
  margin-right: auto;
}

.abas__navegacao--direita {
  margin-left: auto;
  margin-right: 0;
}

.abas__lista {
  overflow: auto;
  overflow-x: auto;
  overflow-y: clip;

  > li {
    padding-right: 2rem;
    display: flex;
    align-items: center;
    flex-basis: 0;
    flex-grow: 1;
    min-width: min-content;
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
  overflow-x: clip;
  overflow-y: visible;
}
</style>
