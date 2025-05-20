<template>
  <nav
    v-if="paginas > 1"
    class="menu-de-paginacao"
  >
    <ul
      class="menu-de-paginacao__lista"
      data-test="menu-paginacao"
    >
      <li
        class="menu-de-paginacao__item menu-de-paginacao__item--anterior"
        :class="{
          'menu-de-paginacao__item--desabilitado': paginaCorrente === 1
        }"
        data-test="item-paginacao-anterior"
      >
        <component
          :is="model ? 'button' : 'router-link'"
          class="menu-de-paginacao__link"
          :type="model ? 'button' : null"
          :to="linkDeRetrocesso"
          data-test="link-paginacao-anterior"
          @click="(ev) => irParaPagina(paginaCorrente - 1)"
        >
          <svg
            aria-hidden="true"
            width="8"
            height="13"
          ><use xlink:href="#i_left" /></svg>
          <span class="menu-de-paginacao__texto">
            Anterior
          </span>
        </component>
      </li>

      <li class="menu-de-paginacao__item menu-de-paginacao__item--corrente">
        <input
          :aria-busy="navegando || $attrs.ariaBusy"
          arial-label="Página corrente"
          :value="paginaCorrente"
          class="like-a__text menu-de-paginacao__campo"
          data-test="campo-navegacao-pagina"
          @change="(ev) => irParaPagina(ev.target.value)"
          @keyup.enter="(ev) => irParaPagina(ev.target.value)"
        >
      </li>

      <li
        class="menu-de-paginacao__item menu-de-paginacao__item--ultima"
      >
        <component
          :is="model ? 'button' : 'router-link'"
          class="menu-de-paginacao__link"
          :type="model ? 'button' : null"
          :to="linkParaUltimaPagina"
          arial-label="Última página"
          @click="(ev) => irParaPagina(paginas)"
        >
          {{ paginas }}
        </component>
      </li>

      <li
        class="menu-de-paginacao__item menu-de-paginacao__item--seguinte"
        :class="{
          'menu-de-paginacao__item--desabilitado': paginaCorrente >= paginas
        }"
      >
        <component
          :is="model ? 'button' : 'router-link'"
          class="menu-de-paginacao__link"
          :type="model ? 'button' : null"
          :to="linkDeAvanco"
          data-test="link-paginacao-seguinte"
          @click="(ev) => irParaPagina(paginaCorrente + 1)"
        >
          <span class="menu-de-paginacao__texto">
            Seguinte
          </span>
          <svg
            aria-hidden="true"
            width="8"
            height="13"
          ><use xlink:href="#i_right" /></svg>
        </component>
      </li>
    </ul>
  </nav>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const model = defineModel();

const emit = defineEmits(['trocaDePaginaSolicitada']);

const props = defineProps({
  paginas: {
    type: Number,
    default: 0,
  },
  temMais: {
    type: Boolean,
    default: false,
  },
  tokenPaginacao: {
    type: String,
    default: '',
  },
  totalRegistros: {
    type: Number,
    default: 0,
  },
  prefixo: {
    type: String,
    default: '',
  },
});

const navegando = ref(false);

const paginaCorrente = computed(() => (model.value
  ? model.value
  : Number(route.query[`${props.prefixo}pagina`]) || 1));

const linkDeAvanco = computed(() => (model.value
  ? null
  : {
    query: {
      ...route.query,
      [`${props.prefixo}token_paginacao`]: props.tokenPaginacao || route.query[`${props.prefixo}token_paginacao`],
      [`${props.prefixo}pagina`]: paginaCorrente.value + 1,
    },
  }));

const linkDeRetrocesso = computed(() => (model.value
  ? null
  : {
    query: {
      ...route.query,
      [`${props.prefixo}token_paginacao`]: paginaCorrente.value === 2
        ? undefined
        : props.tokenPaginacao || route.query[`${props.prefixo}token_paginacao`],
      [`${props.prefixo}pagina`]: paginaCorrente.value - 1,
    },
  }));

const linkParaUltimaPagina = computed(() => (model.value
  ? null
  : {
    query: {
      ...route.query,
      [`${props.prefixo}token_paginacao`]: props.tokenPaginacao || route.query[`${props.prefixo}token_paginacao`],
      [`${props.prefixo}pagina`]: props.paginas,
    },
  }));

async function irParaPagina(numero) {
  emit('trocaDePaginaSolicitada', { pagina: Number(numero) });
  // Não faz nada pois o componente é um router-link
  if (!model) return;

  if (model.value) {
    model.value = Number(numero);
  } else {
    navegando.value = true;

    await router.push({
      query: {
        ...route.query,
        [`${props.prefixo}token_paginacao`]: numero === 1
          ? undefined
          : props.tokenPaginacao || route.query[`${props.prefixo}token_paginacao`],
        [`${props.prefixo}pagina`]: numero,
      },
    });
    navegando.value = false;
  }
}
</script>
<style lang="less" scoped>
.menu-de-paginacao {
  text-transform: uppercase;
  font-weight: 700;
  background-color: @c50;
}

.menu-de-paginacao__lista {
  padding: 1rem;
  display:  flex;
  gap: 2rem;
  justify-content: center;
  align-items: center;
}

.menu-de-paginacao__item {
  min-width: 0;
  display: block;
}

// Manter espaço ocupado para evitar que os links se movam
.menu-de-paginacao__item--desabilitado {
  visibility: hidden;
}

.menu-de-paginacao__item--anterior {}

.menu-de-paginacao__item--corrente {
  width: 3em;
}

.menu-de-paginacao__item--ultima {
  display: flex;
  gap: 2rem;
  align-items: center;

  &:before {
    content: 'de';
     min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
    flex-basis: 0;
  }
}

.menu-de-paginacao__item--seguinte {
}

.menu-de-paginacao__link {
  display: flex;
  align-items: center;
  gap: 0.25em;
  color: @c600;
  background-color: transparent;
  border: 0;

  &:hover,
  &:focus,
  &:active {
    color: @amarelo;
  }
}

.menu-de-paginacao__texto {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  flex-basis: 0;
}

.menu-de-paginacao__campo {
  background-color: @c100;
  border-color: @c100;
  border-style: solid;
  border-width: 1px;
  width: 100%;
  max-width: 100%;
  min-width: 3em;
  text-align: center;
  border-radius: 4px;
  padding: 0.5em;

  &[aria-busy='true'] {
    border-color: @amarelo;
  }
}
</style>
