<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TransitionExpand from './TransitionExpand.vue';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const router = useRouter();

const itensFechados = ref([]);
const menuAberto = ref(true);

const limparRotas = (listaDeRotas) => (Array.isArray(listaDeRotas)
  ? listaDeRotas
  : [listaDeRotas])
  .map((x) => {
    let rotaParaResolver = x;

    if (typeof x === 'string') {
      if (x.indexOf('/') > -1) {
        rotaParaResolver = { path: x };
      } else {
        rotaParaResolver = { name: x };
      }
    }

    return router.resolve({ ...rotaParaResolver, params: route.params });
  })
  // eslint-disable-next-line max-len
  .filter((y) => (!y.meta?.limitarÀsPermissões || temPermissãoPara.value(y.meta.limitarÀsPermissões)))
  || [];

const rotasParaMenu = computed(() => {
  const listaDeRotas = typeof route.meta?.rotasParaMenuSecundário === 'function'
    ? route.meta.rotasParaMenuSecundário()
    : route.meta?.rotasParaMenuSecundário;

  return listaDeRotas
    ? listaDeRotas.reduce((acc, cur) => {
      let rotas = acc[acc.length - 1]?.rotas;

      if (!Array.isArray(rotas)) {
        acc.push({
          títuloParaGrupoDeLinksNoMenu: route?.meta?.títuloParaGrupoDeLinksNoMenu,
          rotas: [],
        });
        rotas = acc[acc.length - 1].rotas;
      }

      if (typeof cur === 'string') {
        rotas.push(cur);
      } else if (Array.isArray(cur.rotas)) {
        acc.push(cur);
      }

      return acc;
    }, [])
      .map((x) => ({ ...x, rotas: limparRotas(x.rotas) }))
      .filter((x) => !!x.rotas?.length)
    : [];
});

const rotasParaMigalhasDePão = computed(() => {
  const listaDeRotas = typeof route.meta?.rotasParaMigalhasDePão === 'function'
    ? route.meta.rotasParaMigalhasDePão()
    : route.meta?.rotasParaMigalhasDePão;

  return listaDeRotas
    ? limparRotas(listaDeRotas)
    : [];
});

function alternarItens(índice) {
  const posiçãoDoÍndice = itensFechados.value.indexOf(índice);

  if (posiçãoDoÍndice > -1) {
    itensFechados.value.splice(posiçãoDoÍndice, 1);
  } else {
    itensFechados.value.push(índice);
  }
}
</script>
<template>
  <div
    v-if="rotasParaMenu.length || rotasParaMigalhasDePão.length"
    class="menu-secundário"
    :class="{ aberto: menuAberto }"
  >
    <button
      type="button"
      class="menu-secundário__botão-de-alternância tipinfo bottom"
      @click="menuAberto = !menuAberto"
    >
      <svg
        width="32"
        height="32"
      ><use xlink:href="#i_right-double" /></svg>
      <div>
        Expandir menu secundário
      </div>
    </button>

    <div
      v-if="rotasParaMigalhasDePão.length"
      class="breadcrumbmenu"
    >
      <router-link
        v-for="item, k in rotasParaMigalhasDePão"
        :key="k"
        :to="item.href"
      >
        <span>
          {{ typeof item.meta?.título === 'function'
            ? item.meta?.título()
            : item.meta?.título || item.name }}
        </span>
      </router-link>
    </div>

    <nav
      v-for="(item, i) in rotasParaMenu"
      :key="i"
      class="menu-secundário__grupos-de-rotas"
    >
      <h2
        v-if="item.títuloParaGrupoDeLinksNoMenu"
        class="menu-secundário__sub-título"
      >
        {{ item.títuloParaGrupoDeLinksNoMenu }}

        <button
          type="button"
          :value="i"
          aria-hidden="true"
          class="menu-secundário__botão-de-alternância-de-grupo"
          :class="{
            'menu-secundário__botão-de-alternância-de-grupo--aberto': itensFechados.includes(i)
          }"
          @click="alternarItens(i)"
        >
          <svg
            width="13"
            height="8"
          ><use xlink:href="#i_down" /></svg>
        </button>
      </h2>
      <TransitionExpand>
        <ul
          v-show="!itensFechados.includes(i)"
          class="menu-secundário__lista-de-links"
        >
          <li
            v-for="rota, k in item.rotas"
            :key="k"
            class="menu-secundário__item-de-lista"
          >
            <router-link
              :to="rota.href"
              class="menu-secundário__link"
            >
              {{ rota.meta?.títuloParaMenu
                || (typeof rota.meta?.título === 'function'
                  ? rota.meta.título()
                  : rota.meta?.título
                )
                || rota.name
              }}
            </router-link>
          </li>
        </ul>
      </TransitionExpand>
    </nav>
  </div>
</template>
<style lang="less" scoped>
.menu-secundário {
  position: fixed;
  left: 70px;
  top: 0;
  bottom: 0;
  /* 224 px */
  max-width: 14rem;
  font-weight: 700;
  z-index: 80;
  background: @branco;

  .transition();
  .bs(0 0 40px 20px fadeOut(black, 93%));

  + #dashboard {
    margin-left: 350px;
  }
}

.menu-secundário__botão-de-alternância,
.menu-secundário__botão-de-alternância-de-grupo {
  border: 0;
  padding: 0;
}

.menu-secundário__botão-de-alternância {
  background-color: @branco;
  position: absolute;
  border-radius: 100%;
  top: 1rem;
  left: 0;
  z-index: 1000;

  .bs();
  .transition();
  transform: translateX(-50%);
  left: 100%;

  svg {
    .transition();

    .menu-secundário.aberto & {
      transform: rotate(180deg);
    }
  }
}

.menu-secundário__botão-de-alternância-de-grupo {
  background: none;
}

.menu-secundário__botão-de-alternância-de-grupo svg {
  transform: rotate(-180deg);
}

.menu-secundário__botão-de-alternância-de-grupo--aberto svg {
  transform: rotate(0);
}

.menu-secundário__grupos-de-rotas {
  overflow: hidden;
  width: 0;
  padding-top: 1rem;
  padding-bottom: 1rem;
  .transition();

  .menu-secundário.aberto & {
    width: 100%;
  }

  > * {
    margin-left: 1rem;
    margin-right: 1rem;

    @media (min-width: @larguras-de-tela__estreita) {
      margin-right: 1.5rem;
      margin-left: 1.5rem;
    }
  }
}

.menu-secundário__sub-título {
  color: @amarelo;
  font-size: 1rem;
  display: flex;
  margin-top: 0;
  margin-bottom: 1rem;
  gap: 1rem;
}

.menu-secundário__link {
  font-size: 1.142857rem;
  display: block;
  padding: 1rem 0;

  border-bottom: 1px solid @c100;
}
</style>
