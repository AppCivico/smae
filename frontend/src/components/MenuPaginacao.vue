<template>
  <nav class="menu-de-paginacao">
    <ul class="menu-de-paginacao__lista">
      <li
        v-if="paginas > 1"
        class="menu-de-paginacao__item menu-de-paginacao__item--anterior"
        :class="{
          'menu-de-paginacao__item--desabilitado': paginaCorrente === 1
        }"
      >
        <router-link
          class="menu-de-paginacao__link"
          :to="{
            query: {
              ...$route.query,
              token_paginacao: tokenPaginacao || $route.query.token_paginacao,
              pagina: paginaCorrente - 1,
            },
          }"
        >
          <svg
            aria-hidden="true"
            width="8"
            height="13"
          ><use xlink:href="#i_left" /></svg>
          <span class="menu-de-paginacao__texto">
            Anterior
          </span>
        </router-link>
      </li>

      <li class="menu-de-paginacao__item menu-de-paginacao__item--corrente">
        <input
          :aria-busy="navegando"
          aria-label="Página corrente"
          :value="paginaCorrente"
          class="like-a__text menu-de-paginacao__campo"
          @change="(ev) => irParaPagina(ev.target.value)"
          @keyup.enter="(ev) => irParaPagina(ev.target.value)"
        >
      </li>

      <li
        v-if="paginas > 1"
        class="menu-de-paginacao__item menu-de-paginacao__item--ultima"
      >
        <router-link
          class="menu-de-paginacao__link"
          :to="{
            query: {
              ...$route.query,
              token_paginacao: tokenPaginacao || $route.query.token_paginacao,
              pagina: paginas,
            },
          }"
          aria-label="Última página"
        >
          {{ paginas }}
        </router-link>
      </li>

      <li
        v-if="paginaCorrente < paginas"
        class="menu-de-paginacao__item menu-de-paginacao__item--seguinte"
      >
        <router-link
          class="menu-de-paginacao__link"
          :to="{
            query: {
              ...$route.query,
              token_paginacao: tokenPaginacao || $route.query.token_paginacao,
              pagina: paginaCorrente + 1,
            },
          }"
        >
          <span class="menu-de-paginacao__texto">
            Seguinte
          </span>
          <svg
            aria-hidden="true"
            width="8"
            height="13"
          ><use xlink:href="#i_right" /></svg>
        </router-link>
      </li>
    </ul>
  </nav>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const navegando = ref(false);

const route = useRoute();
const router = useRouter();

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
});

const paginaCorrente = computed(() => Number(route.query.pagina) || 1);

async function irParaPagina(numero) {
  navegando.value = true;

  await router.push({
    query: {
      ...route.query,
      token_paginacao: props.tokenPaginacao || route.query.token_paginacao,
      pagina: numero,
    },
  });

  navegando.value = false;
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
