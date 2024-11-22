<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import TransitionExpand from './TransitionExpand.vue';

const authStore = useAuthStore();
const {
  sistemaCorrente, dadosDoSistemaEscolhido, temPermissãoPara, user,
} = storeToRefs(authStore);
const router = useRouter();
const route = useRoute();

const índiceDoItemAberto = ref(-1);

const filtrarRota = (
  rota,
  considerarPresençaNoMenu = true,
) => (rota.meta?.presenteNoMenu || !considerarPresençaNoMenu)
  && (!rota.meta?.entidadeMãe || rota.meta.entidadeMãe === route.meta?.entidadeMãe)
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

const rotaInicial = computed(() => (Array.isArray(dadosDoSistemaEscolhido.value?.rotaInicial)
  ? dadosDoSistemaEscolhido.value?.rotaInicial
    .find((rota) => !rota.meta?.limitarÀsPermissões
      || temPermissãoPara.value(rota.meta?.limitarÀsPermissões))
  : dadosDoSistemaEscolhido.value?.rotaInicial));

onBeforeRouteUpdate(() => {
  índiceDoItemAberto.value = -1;
});
</script>
<template>
  <!-- eslint-disable max-len vue/no-v-html -->
  <header
    class="cabeçalho"
    :class="{ aberto: índiceDoItemAberto === Infinity }"
  >
    <hgroup class="cabeçalho__títulos">
      <h1 class="cabeçalho__nome-do-site">
        <abbr title="Sistema de Monitoramento e Acompanhamento Estratégico">
          SMAE
        </abbr>
      </h1>

      <div class="cabeçalho__nome-e-ícone-do-módulo">
        <img
          :src="dadosDoSistemaEscolhido.ícone"
          class="cabeçalho__ícone-do-módulo"
          width="24"
          height="24"
          aria-hidden="true"
        >
        <h2 class="cabeçalho__nome-do-módulo">
          {{ dadosDoSistemaEscolhido?.nome || sistemaCorrente }}
        </h2>
      </div>

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
          <SmaeLink
            v-if="rotaInicial"
            :to="rotaInicial"
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
          </SmaeLink>
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
            <span
              v-if="item.meta?.títuloParaMenu"
              class="menu__texto-do-link"
            >
              {{ typeof item.meta.títuloParaMenu === 'function' ? item.meta.títuloParaMenu() : item.meta.títuloParaMenu }}
            </span>
            <span
              v-else-if="item.meta?.título"
              class="menu__texto-do-link"
            >
              {{ typeof item.meta.título === 'function' ? item.meta.título() : item.meta.título }}
            </span>
            <span
              v-else
              class="menu__texto-do-link"
            >
              {{ item.name }}
            </span>
            <svg
              class="menu__ícone-de-abertura"
              :class="{ 'menu__ícone-de-abertura--aberto': índiceDoItemAberto === i }"
              width="13"
              height="8"
            ><use xlink:href="#i_down" /></svg>
          </button>
          <SmaeLink
            v-else
            :to="item.path"
            class="menu__link"
          >
            <span
              v-if="item.meta?.íconeParaMenu"
              class="menu__envelope-svg"
              v-html="item.meta.íconeParaMenu"
            />
            <span
              v-if="item.meta?.títuloParaMenu"
              class="menu__texto-do-link"
            >
              {{ typeof item.meta.títuloParaMenu === 'function' ? item.meta.títuloParaMenu() : item.meta.títuloParaMenu }}
            </span>
            <span
              v-else-if="item.meta?.título"
              class="menu__texto-do-link"
            >
              {{ typeof item.meta.título === 'function' ? item.meta.título() : item.meta.título }}
            </span>
            <span
              v-else
              class="menu__texto-do-link"
            >
              {{ item.name }}
            </span>
          </SmaeLink>
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
                <SmaeLink
                  class="menu__link menu__link--sub"
                  :to="subitem.path"
                >
                  <span
                    v-if="subitem.meta?.títuloParaMenu"
                    class="menu__texto-do-link"
                  >
                    {{ typeof subitem.meta.títuloParaMenu === 'function' ? subitem.meta.títuloParaMenu() : subitem.meta.títuloParaMenu }}
                  </span>
                  <span
                    v-else-if="subitem.meta?.título"
                    class="menu__texto-do-link"
                  >
                    {{ typeof subitem.meta.título === 'function' ? subitem.meta.título() : subitem.meta.título }}
                  </span>
                  <span
                    v-else
                    class="menu__texto-do-link"
                  >
                    {{ subitem.name }}
                  </span>
                </SmaeLink>
              </li>
            </ul>
          </TransitionExpand>
        </li>
        <li
          class="menu__item menu__item--módulos"
        >
          <SmaeLink
            :to="{ name: 'home' }"
            class="menu__link menu__link--módulos"
          >
            <span class="menu__envelope-svg">
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M5.25252 17.9261C5.28225 17.8306 5.31458 17.7358 5.34949 17.6418C5.62916 16.8887 6.06814 16.2043 6.63622 15.6362C7.20429 15.0681 7.88819 14.6292 8.64132 14.3495C9.39444 14.0698 10.1988 13.9558 11 14.0154C11.8012 13.9558 12.606 14.0698 13.3592 14.3495C14.1123 14.6292 14.7962 15.0681 15.3643 15.6362C15.9323 16.2043 16.3708 16.8887 16.6505 17.6418C16.6854 17.7358 16.7178 17.8306 16.7475 17.9261C18.7347 16.2752 20 13.7854 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 13.7854 3.26532 16.2752 5.25252 17.9261ZM22 11C22 17.0751 17.0751 22 11 22C4.92487 22 0 17.0751 0 11C0 4.92487 4.92487 0 11 0C17.0751 0 22 4.92487 22 11ZM11 12C12.6569 12 14 10.6569 14 9C14 7.34315 12.6569 6 11 6C9.34315 6 8 7.34315 8 9C8 10.6569 9.34315 12 11 12Z"
                />
              </svg>
            </span>
            <span class="menu__texto-do-link">
              Meus módulos
            </span>
          </SmaeLink>
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
  max-height: 100vh;
  overflow: auto;
  overflow-x: clip;
  overflow-y: auto;
  z-index: 110;
  display: flex;
  flex-direction: column;
  width: 5.142857rem;
  /* 72px */
  .transition(width);
  .bs();

  &:hover,
  &.aberto {
    width: 14rem;
    /* 196px */
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

.cabeçalho__nome-e-ícone-do-módulo {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.cabeçalho__ícone-do-módulo {
  display: block;
  margin-left: auto;
  margin-right: auto;
  flex-grow: 0;
}

.cabeçalho__nome-do-módulo {
  font-size: 0.857143rem;
  line-height: 1.5em;
  max-height: 3em;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  display: none;
  text-align: left;
  white-space: nowrap;
  flex-grow: 1;

  .cabeçalho:hover &,
  .cabeçalho.aberto & {
    display: block;
  }
}

.cabeçalho__botão-de-menu {
  margin-left: auto;
  margin-right: auto;
  background: none;
  border: 0;
  display: block;

  .transition(margin-left);

  .cabeçalho:hover &,
  .cabeçalho.aberto & {
    margin-left: 0;
  }

  @media (pointer: fine) {
    display: none;
  }
}

.cabeçalho__menu {}

.menu {
  font-weight: 700;
  color: @amarelo;
  font-size: 1rem;
  flex-grow: 1;
  flex-direction: column;
  display: flex;
}

.menu__lista {
  flex-grow: 1;
  flex-direction: column;
  display: flex;
}

.menu__lista--sub {
  margin-bottom: 1rem;
  display: none;

  .cabeçalho:hover &,
  .cabeçalho.aberto & {
    display: block;
  }
}

.menu__item {
  border-bottom: 1px solid fadeOut(@c100, 80%);
}

.menu__item--módulos {
  margin-top: auto;
  margin-bottom: 0;
}

.menu__item--sub {
  border: 0;
}

:deep(.menu__link) {
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
  min-height: calc(24px + 1.5rem * 2);

  @media (min-height: 570px) {
    padding: 1.5rem 1rem;
  }
}

:deep(.menu__link--sub) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  min-height: 0;
}

:deep(.menu__link--módulos) {
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

.menu__ícone-de-abertura {}

.menu__ícone-de-abertura--aberto {
  transform: rotate(-180deg);
}
</style>
