<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TransitionExpand from './TransitionExpand.vue';

const authStore = useAuthStore();
const {
  sistemaEscolhido, dadosDoSistemaEscolhido, temPermissãoPara, user,
} = storeToRefs(authStore);
const router = useRouter();
const route = useRoute();

const índiceDoItemAberto = ref(-1);

const filtrarRota = (rota, presenteNoMenu = true) => (rota.meta?.presenteNoMenu || !presenteNoMenu)
  && (!rota.meta?.limitarÀsPermissões
    || temPermissãoPara.value(rota.meta?.limitarÀsPermissões));

const ordenarRota = (a, b) => (a.meta?.pesoNoMenu !== undefined && b.meta?.pesoNoMenu !== undefined
  ? a.meta.pesoNoMenu - b.meta.pesoNoMenu
  : 0);

const resolverRota = (nome) => router.resolve({ name: nome, params: route.params });

const menuFiltrado = router.options.routes
  .filter((x) => filtrarRota(x))
  .sort(ordenarRota)
  .map((x) => ({
    ...x,
    rotasFilhas: Array.isArray(x.meta.rotasParaMenuPrincipal)
      ? x.meta.rotasParaMenuPrincipal
        .map(resolverRota)
        .filter((y) => filtrarRota(y, false))
      : [],
  }));
</script>
<template>
  <!-- eslint-disable max-len vue/no-v-html -->
  <header
    class="cabeçalho"
    :class="{ aberto: índiceDoItemAberto > -1 }"
  >
    <hgroup class="cabeçalho__títulos">
      <h1 class="cabeçalho__nome-do-site">
        <abbr title="Sistema de Monitoramento e Acompanhamento Estratégico">
          SMAE
        </abbr>
      </h1>
      <p class="cabeçalho__nome-do-módulo">
        <abbr
          v-if="dadosDoSistemaEscolhido?.sigla && dadosDoSistemaEscolhido?.nome"
          class="cabeçalho__sigla-do-módulo"
          :title="dadosDoSistemaEscolhido.nome"
        >
          <span>
            {{ dadosDoSistemaEscolhido.sigla }}
          </span>
        </abbr>
        <template v-else>
          {{ dadosDoSistemaEscolhido?.nome || sistemaEscolhido }}
        </template>
      </p>

      <button
        type="button"
        aria-label="Abrir menu"
        class="cabeçalho__botão-de-menu"
        @click="índiceDoItemAberto === Infinity
          ? índiceDoItemAberto = -1
          : índiceDoItemAberto = Infinity"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_graf" /></svg>
      </button>
    </hgroup>
    <nav
      v-if="user"
      id="menu"
      class="cabeçalho__menu menu only-desktop-menu"
    >
      <ul class="menu__lista">
        <li class="menu__item">
          <router-link
            :to="{
              name: 'home',
            }"
            class="menu__link"
          >
            <span class="menu__envelope-svg">
              <svg
                width="24"
                height="24"
              ><use xlink:href="#i_home" /></svg>
            </span>
            <span class="menu__texto-do-link">
              Página inicial
            </span>
          </router-link>
        </li>

        <li
          v-for="(item, i) in menuFiltrado"
          :key="i"
          class="menu__item"
        >
          <button
            v-if="item.rotasFilhas?.length > 0"
            type="button"
            class="menu__link menu__link--button"
            @click="índiceDoItemAberto === i
              ? índiceDoItemAberto = -1
              : índiceDoItemAberto = i"
          >
            <span
              v-if="item.meta?.íconeParaMenu"
              class="menu__envelope-svg"
              v-html="item.meta.íconeParaMenu"
            />
            <span class="menu__texto-do-link">
              {{ item.meta?.títuloParaMenu || item.meta?.título || item.name }}
            </span>
            <svg
              class="menu__ícone-de-abertura"
              :class="{
                'menu__ícone-de-abertura--aberto': índiceDoItemAberto === i
              }"
              width="13"
              height="8"
            ><use xlink:href="#i_down" /></svg>
          </button>
          <router-link
            v-else
            :to="item.path"
            class="menu__link"
          >
            <span
              v-if="item.meta?.íconeParaMenu"
              class="menu__envelope-svg"
              v-html="item.meta.íconeParaMenu"
            />
            <span class="menu__texto-do-link">
              {{ item.meta?.títuloParaMenu || item.meta?.título || item.name }}
            </span>
          </router-link>
          <TransitionExpand>
            <ul
              v-if="item.rotasFilhas?.length"
              v-show="índiceDoItemAberto === i"
              class="menu__lista menu__lista--sub"
            >
              <li
                v-for="(subitem, j) in item.rotasFilhas"
                :key="j"
                class="menu__item menu__item--sub"
              >
                <router-link
                  class="menu__link menu__link--sub"
                  :to="subitem.path"
                >
                  <span>{{ subitem.meta?.títuloParaMenu || subitem.meta?.título || subitem.name }}</span>
                </router-link>
              </li>
            </ul>
          </TransitionExpand>
        </li>
      </ul>
    </nav>
  </header>
</template>
<style lang="less" scoped>
.cabeçalho {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background: @primary;

  z-index: 110;
  width: 5.142857rem; /* 72px */
  .transition(width);
  .bs();

  &:hover,
  &.aberto {
    width: 12.857143rem; /* 180px */
  }
}

.cabeçalho__títulos {
  background-color: @amarelo;
  color: @primary;
  padding: 1rem 0.5rem;
  font-weight: 700;
  text-align: center;
  .transition(text-align);

  abbr {
    border: 0;
    text-decoration: none;
  }

  .cabeçalho:hover &,
  .cabeçalho.aberto & {
    text-align: left;
    padding: 1rem;
  }
}

.cabeçalho__nome-do-site {
  font-size: 1.142857rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cabeçalho__nome-do-módulo {
  font-size: 1.714286rem;
  line-height: 1.5em;
  max-height: 3em;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.cabeçalho__sigla-do-módulo {
  .cabeçalho:hover &,
  .cabeçalho.aberto & {
    &::before {
      content: attr(title);
    }

    span {
      display: none;
    }
  }
}

.cabeçalho__botão-de-menu {
  margin-left: auto;
  margin-right: auto;
  background: none;
  border: 0;
  display: block;

  .transition(margin-left);

  .cabeçalho:hover & ,
  .cabeçalho.aberto & {
    margin-left: 0;
  }

  @media (pointer: fine) {
    display: none;
  }
}

.cabeçalho__menu {
}

.menu {
  font-weight: 700;
  color: @amarelo;
}

.menu__lista {
}

.menu__lista--sub {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.menu__item {
  border-bottom: 1px solid fadeOut(@c100, 80%);
}

.menu__item--sub {
  border: 0;
}

.menu__link {
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 1rem;
  display: flex;
  width: 100%;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  color: inherit;
  font-weight: inherit;

  @media (min-height: 570px) {
    padding: 1.5rem 1rem;
  }
}

.menu__link--sub {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.menu__link--perfil {
  background-color: @amarelo;
  color: @primary;
}

.menu__envelope-svg {
  margin-right: auto;
  margin-left: auto;
  display: inline;
  flex-grow: 0;
  opacity: 1;
  width: auto;
  max-width: none;

  svg {
    display: inline-block;
    vertical-align: middle;
    fill: currentColor;
  }
}

.menu__texto-do-link,
.menu__ícone-de-abertura {
  display: none;

  .cabeçalho:hover &,
  .aberto & {
    display: block;
  }
}

.menu__texto-do-link {
  flex-grow: 1;
  text-align: left;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.menu__ícone-de-abertura {
}

.menu__ícone-de-abertura--aberto {
  transform: rotate(-180deg);
}
</style>
