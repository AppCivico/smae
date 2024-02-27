<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

let menuMobile = ref(0);
function toggleMenu() {
  menuMobile = !menuMobile.value;
}
const props = defineProps(['activate']);

const authStore = useAuthStore();

const { permissions, temPermissãoPara, user } = storeToRefs(authStore);
const perm = permissions.value;
const route = useRoute();
const router = useRouter();
const primeiroSegmento = route.matched?.[0]?.path;

const menuFiltrado = router.options.routes
  .filter((x) => x.meta?.presenteNoMenu
    && (!x.meta?.restringirÀsPermissões || temPermissãoPara.value(x.meta?.restringirÀsPermissões)));
</script>

<template>
  <!-- eslint-disable max-len vue/no-v-html -->
  <nav
    v-if="user"
    id="menu"
    class="only-desktop-menu"
    :class="{ aberto: menuMobile }"
  >
    <div class="top">
      <component
        :is="user?.flags?.panorama
          && temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
          ? 'router-link'
          : 'span'"
        id="m_profile"
        :to="user?.flags?.panorama
          ? {
            name: 'panorama'
          }
          : undefined"
        :class="{
          'like-a__link': !user?.flags?.panorama
        }"
      >
        <span class="profile-name">
          {{ user.nome_exibicao }}
        </span>
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
      </component>

      <router-link
        v-for="item, k in menuFiltrado"
        :key="k"
        :to="item.path"
        :class="{ active: item.path === primeiroSegmento }"
        @click="toggleMenu"
      >
        <span>{{ item.meta?.títuloParaMenu || item.meta?.título || item.name }}</span>
        <span
          v-if="item.meta?.íconeParaMenu"
          class="menu__envelope-svg"
          v-html="item.meta.íconeParaMenu"
        />
      </router-link>
    </div>

    <div class="bottom">
      <a @click="authStore.logout()">
        <span>Logout</span>
        <svg
          width="22"
          height="22"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path
            d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V2zm1 13h8V2H4v13z"
          />
          <path d="M9 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
        </svg>
      </a>
      <router-link
        v-if="!perm.PDM?.ponto_focal"
        to="/usuarios"
        @click="toggleMenu"
      >
        <span>Usuários</span>
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path
            d="M18.2425 4.24239L18.2425 2H19.7577V4.24239H22.0001V5.75762H19.7577V8H18.2425L18.2425 5.75762H16.0001V4.24239H18.2425ZM11.0001 13.5294C13.0793 13.5294 14.7648 11.8439 14.7648 9.76471C14.7648 7.68552 13.0793 6 11.0001 6C8.92093 6 7.23541 7.68552 7.23541 9.76471C7.23541 11.8439 8.92093 13.5294 11.0001 13.5294ZM11.0001 14.4899C9.99473 14.4151 8.9853 14.5582 8.0402 14.9092C7.0951 15.2601 6.23687 15.811 5.524 16.5239C4.81112 17.2368 4.26024 18.0956 3.90927 19.0407C3.55831 19.9858 3.41522 20.9946 3.49001 22H18.5102C18.585 20.9946 18.4419 19.9858 18.091 19.0407C17.74 18.0956 17.1897 17.2368 16.4768 16.5239C15.764 15.811 14.9057 15.2601 13.9606 14.9092C13.0155 14.5582 12.0055 14.4151 11.0001 14.4899Z"
          />
        </svg>
      </router-link>
    </div>

    <div class="overlay only-desktop" />
  </nav>
</template>
<style lang="less">
@import "@/_less/variables.less";
#menu {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background: @primary;
  color: @amarelo;
  z-index: 110;
  .transition();
  .like-a__link,
  a {
    font-weight: 700;
    display: flex;
    padding: 23px 23px;
    border-bottom: 1px solid fadeOut(@c100, 80%);
    .transition();
    span {
      flex-grow: 1;
      display: inline-block;
      vertical-align: middle;
      overflow: hidden;
      max-width: 0;
      .opacity(0);
      height: 20px;
      line-height: 20px;
      .transition();
      &.profile-name {
        text-transform: capitalize;
      }
    }

    .menu__envelope-svg {
      display: inline;
      flex-grow: 0;
      opacity: 1;
      width: auto;
      max-width: none;
    }

    svg {
      display: inline-block;
      vertical-align: middle;
      fill: currentColor;
      * {
        .transition();
      }
    }
    &:hover {
      color: @amarelo;
      padding-top: 40px;
      padding-bottom: 40px;
    }
    &:active,
    &.active,
    &.inv {
      background: @amarelo;
      color: @primary;
    }
  }
  .bottom {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
  &:hover {
    .bs(0 0 40px 20px fadeOut(black,80%));

    .like-a__link,
    a {
      gap: 0 1em;
      span {
        width: auto;
        max-width: 8.75rem;
        .opacity(1);
      }
    }
  }

  @media (max-height: 570px) {
    .like-a__link,
    a {
      padding: 15px;
      &:hover {
        padding: 15px;
      }
    }
  }
}
</style>
