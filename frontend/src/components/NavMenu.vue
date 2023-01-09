<script setup>
import { router } from '@/router';
import { useAuthStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

let menuMobile = ref(0);
function toggleMenu() {
  menuMobile = !menuMobile.value;
}
const props = defineProps(['activate']);

const authStore = useAuthStore();
const { user, permissions, temPermissãoPara } = storeToRefs(authStore);
const perm = permissions.value;
const route = useRoute();
const primeiroSegmento = route.matched?.[0]?.path;

const menuFiltrado = router.options.routes
  .filter((x) => x.meta?.presenteNoMenu
    && (!x.restringirÀsPermissões || temPermissãoPara(x.restringirÀsPermissões)));

authStore.getDados();
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <nav
    v-if="user"
    id="menu"
    class="only-desktop-menu"
    :class="{ aberto: menuMobile }"
  >
    <div class="top">
      <a
        id="m_profile"
        href="javascript:void(0);"
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
      </a>
      <router-link
        v-if="perm.algumAdmin"
        to="/administracao"
        :class="{ active: props.activate == 'SubmenuConfig' }"
        @click="toggleMenu"
      >
        <span>Administração</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M18 12V11.2V8.8V8.001H3.6L2 8V12H18ZM18 6V5.2V2.8V2.001H3.6L2 2V6H18ZM2 0H17.99C19.33 0 20 0.668 20 2V17.92C20 19.307 19.333 20 18 20H2C0.667 20 0 19.307 0 17.92V2C0 0.667 0.667 0 2 0ZM3.6 14H2V18H18V17.2V14.8V14.001H3.6V14ZM4 5C3.73478 5 3.48043 4.89464 3.29289 4.70711C3.10536 4.51957 3 4.26522 3 4C3 3.73478 3.10536 3.48043 3.29289 3.29289C3.48043 3.10536 3.73478 3 4 3C4.26522 3 4.51957 3.10536 4.70711 3.29289C4.89464 3.48043 5 3.73478 5 4C5 4.26522 4.89464 4.51957 4.70711 4.70711C4.51957 4.89464 4.26522 5 4 5ZM4 11C3.73478 11 3.48043 10.8946 3.29289 10.7071C3.10536 10.5196 3 10.2652 3 10C3 9.73478 3.10536 9.48043 3.29289 9.29289C3.48043 9.10536 3.73478 9 4 9C4.26522 9 4.51957 9.10536 4.70711 9.29289C4.89464 9.48043 5 9.73478 5 10C5 10.2652 4.89464 10.5196 4.70711 10.7071C4.51957 10.8946 4.26522 11 4 11ZM4 17C3.73478 17 3.48043 16.8946 3.29289 16.7071C3.10536 16.5196 3 16.2652 3 16C3 15.7348 3.10536 15.4804 3.29289 15.2929C3.48043 15.1054 3.73478 15 4 15C4.26522 15 4.51957 15.1054 4.70711 15.2929C4.89464 15.4804 5 15.7348 5 16C5 16.2652 4.89464 16.5196 4.70711 16.7071C4.51957 16.8946 4.26522 17 4 17Z"
          />
        </svg>
      </router-link>
      <router-link
        v-if="perm.CadastroMeta"
        to="/metas"
        :class="{ active: props.activate == 'SubmenuMetas' }"
        @click="toggleMenu"
      >
        <span>Metas</span>
        <svg
          width="19"
          height="22"
          viewBox="0 0 19 22"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M15 0H8C7.46957 0 6.96086 0.210712 6.58578 0.585785C6.21071 0.960858 6 1.46957 6 2V14C6 14.5304 6.21071 15.0391 6.58578 15.4142C6.96086 15.7893 7.46957 16 8 16H17C17.5304 16 18.0391 15.7893 18.4142 15.4142C18.7893 15.0391 19 14.5304 19 14V4L15 0ZM17 14H8V2H13V6H17V14Z"
          />
          <path
            d="M5 5H3V17C3 17.5304 3.21071 18.0391 3.58578 18.4142C3.96086 18.7893 4.46957 19 5 19H14V17H5V5Z"
          />
          <path
            d="M0 8H2V20H11V22H2C1.46957 22 0.960858 21.7893 0.585785 21.4142C0.210712 21.0391 0 20.5304 0 20V8Z"
          />
        </svg>
      </router-link>
      <router-link
        v-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp||perm.PDM?.ponto_focal)"
        to="/monitoramento"
        :class="{ active: props.activate == 'SubmenuMonitoramento' }"
        @click="toggleMenu"
      >
        <span>Monitoramento</span>
        <svg
          width="20"
          height="22"
          viewBox="0 0 20 22"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M6 0C6.55229 0 7 0.447715 7 1V2H13V1C13 0.447715 13.4477 0 14 0C14.5523 0 15 0.447715 15 1V2.00163C15.4755 2.00489 15.891 2.01471 16.2518 2.04419C16.8139 2.09012 17.3306 2.18868 17.816 2.43597C18.5686 2.81947 19.1805 3.43139 19.564 4.18404C19.8113 4.66937 19.9099 5.18608 19.9558 5.74817C20 6.28936 20 6.95372 20 7.75868V11.5C20 12.0523 19.5523 12.5 19 12.5C18.4477 12.5 18 12.0523 18 11.5V10H2V16.2C2 17.0566 2.00078 17.6389 2.03755 18.089C2.07337 18.5274 2.1383 18.7516 2.21799 18.908C2.40973 19.2843 2.7157 19.5903 3.09202 19.782C3.24842 19.8617 3.47262 19.9266 3.91104 19.9624C4.36113 19.9992 4.94342 20 5.8 20H10C10.5523 20 11 20.4477 11 21C11 21.5523 10.5523 22 10 22H5.75868C4.95372 22 4.28936 22 3.74817 21.9558C3.18608 21.9099 2.66937 21.8113 2.18404 21.564C1.43139 21.1805 0.819468 20.5686 0.435975 19.816C0.188684 19.3306 0.0901197 18.8139 0.0441945 18.2518C-2.28137e-05 17.7106 -1.23241e-05 17.0463 4.31292e-07 16.2413V7.7587C-1.23241e-05 6.95373 -2.28137e-05 6.28937 0.0441945 5.74817C0.0901197 5.18608 0.188684 4.66937 0.435975 4.18404C0.819468 3.43139 1.43139 2.81947 2.18404 2.43597C2.66937 2.18868 3.18608 2.09012 3.74818 2.04419C4.10898 2.01471 4.52454 2.00489 5 2.00163V1C5 0.447715 5.44772 0 6 0ZM5 4.00176C4.55447 4.00489 4.20463 4.01356 3.91104 4.03755C3.47262 4.07337 3.24842 4.1383 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2.1383 5.24842 2.07337 5.47262 2.03755 5.91104C2.00078 6.36113 2 6.94342 2 7.8V8H18V7.8C18 6.94342 17.9992 6.36113 17.9624 5.91104C17.9266 5.47262 17.8617 5.24842 17.782 5.09202C17.5903 4.71569 17.2843 4.40973 16.908 4.21799C16.7516 4.1383 16.5274 4.07337 16.089 4.03755C15.7954 4.01356 15.4455 4.00489 15 4.00176V5C15 5.55228 14.5523 6 14 6C13.4477 6 13 5.55228 13 5V4H7V5C7 5.55228 6.55229 6 6 6C5.44772 6 5 5.55228 5 5V4.00176ZM19.7071 14.7929C20.0976 15.1834 20.0976 15.8166 19.7071 16.2071L15.2071 20.7071C14.8166 21.0976 14.1834 21.0976 13.7929 20.7071L11.7929 18.7071C11.4024 18.3166 11.4024 17.6834 11.7929 17.2929C12.1834 16.9024 12.8166 16.9024 13.2071 17.2929L14.5 18.5858L18.2929 14.7929C18.6834 14.4024 19.3166 14.4024 19.7071 14.7929Z"
          />
        </svg>
      </router-link>

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
  z-index: 11;
  .transition();
  a {
    font-weight: 700;
    display: block;
    padding: 23px 23px;
    border-bottom: 1px solid fadeOut(@c100, 80%);
    .transition();
    span {
      display: inline-block;
      vertical-align: middle;
      overflow: hidden;
      width: 0;
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
      opacity: 1;
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
    &#m_profile {
      background-color: #07141a;
      div {
        position: relative;
        right: 3px;
        top: 1px;
        display: inline-block;
        height: 25px;
        width: 25px;
        border: 3px solid @amarelo;
        border-radius: 50%;
        color: @amarelo;
        p {
          line-height: 19px;
          margin: 0 2px 0 1px;
          text-align: center;
        }
      }
    }
  }
  .bottom {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
  &:hover {
    .bs(0 0 40px 20px fadeOut(black,80%));
    a {
      span {
        width: 120px;
        .opacity(1);
      }
    }
  }

  @media (max-height: 570px) {
    a {
      padding: 15px;
      &:hover {
        padding: 15px;
      }
    }
  }
}
</style>
