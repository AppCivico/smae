<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import TransitionExpand from './TransitionExpand.vue';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const router = useRouter();

const itensFechados = ref([]);
const menuAberto = ref(true);

const limparRotas = (listaDeRotas) => {
  const rotasLimpas = [];

  let i = 0;
  while (i < listaDeRotas.length) {
    let rotaParaResolver = listaDeRotas[i];

    if (typeof rotaParaResolver === 'string') {
      if (rotaParaResolver.indexOf('/') > -1) {
        rotaParaResolver = { path: rotaParaResolver };
      } else {
        rotaParaResolver = { name: rotaParaResolver };
      }
    }

    try {
      const resolvedRoute = router.resolve({ ...rotaParaResolver, params: route.params });
      if (
        resolvedRoute
        && (
          !resolvedRoute.meta?.limitarÀsPermissões
          || temPermissãoPara.value(resolvedRoute.meta.limitarÀsPermissões)
        )
      ) {
        rotasLimpas.push(resolvedRoute);
      }
    } catch (erro) {
      console.error(erro);
      console.error('Erro ao resolver rota', rotaParaResolver);
      console.error('Params', route.params);
    }

    i += 1;
  }

  return rotasLimpas;
};

const rotasParaMenu = computed(() => {
  const listaDeRotas = typeof route.meta?.rotasParaMenuSecundário === 'function'
    ? route.meta.rotasParaMenuSecundário()
    : route.meta?.rotasParaMenuSecundário;

  return listaDeRotas
    ? listaDeRotas.reduce((acc, cur) => {
      let rotas = acc[acc.length - 1]?.rotas;

      if (!Array.isArray(rotas)) {
        acc.push({
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
    v-if="rotasParaMenu.length"
    class="menu-secundário"
    :class="{ aberto: menuAberto }"
  >
    <button
      type="button"
      class="menu-secundário__botão-de-alternância"
      aria-hidden="true"
      title="Expandir menu secundário"
      @click="menuAberto = !menuAberto"
    >
      <svg
        width="32"
        height="32"
      ><use xlink:href="#i_right-double" /></svg>
    </button>

    <nav
      v-for="(item, i) in rotasParaMenu"
      :key="i"
      class="menu-secundário__grupos-de-rotas"
    >
      <h2
        v-if="item.título"
        class="menu-secundário__sub-título"
      >
        {{ item.título }}

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
              :to="rota?.name ? { name: rota.name } : rota.href"
              class="menu-secundário__link"
              exact-active-class="tamarelo menu-secundário__link-selecionado"
            >
              <!-- TODO:  transformar em função -->
              {{ (typeof rota.meta?.títuloParaMenu === 'function'
                ? rota.meta.títuloParaMenu()
                : rota.meta?.títuloParaMenu)
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
<style lang="less">
@largura-minima: 12px;
/* 224 px */
@largura-maxima: 14rem;

.menu-secundário {
  position: fixed;
  left: 70px;
  top: 0;
  bottom: 0;
  max-width: @largura-maxima;
  width: @largura-minima;
  font-weight: 700;
  z-index: 80;
  background: @branco;
  padding-top: 2rem;
  max-height: 100vh;
  overflow: visible;
  .bs(0 0 40px 20px fadeOut(black, 93%));
  .transition(width);

  + #dashboard {
    .transition(margin-left);
    // largura do menus somados
    margin-left: calc(@largura-minima + 5.142857rem);
  }

  &.aberto {
    overflow: auto;
    overflow-x: visible;
    overflow-y: auto;
    width: 100%;

    + #dashboard {
      // largura do menus somados
      margin-left: calc(@largura-maxima + 5.142857rem);
    }
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
  top: 0.5rem;
  left: 0;
  z-index: 1000;

  .bs();
  .transition(transform);
  transform: translateX(-25%);
  left: 100%;

  .menu-secundário.aberto & {
    transform: translateX(calc(-100% - 12px));
    box-shadow: none;
  }

  svg {
    .transition(transform);

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
  width: @largura-minima;
  padding-top: 1rem;
  padding-bottom: 1rem;
  .transition(width);

  .menu-secundário.aberto & {
    width: 100%;
  }

  > * {
    margin-right: 1.5rem;
    margin-left: 1.5rem;
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
  font-size: 1rem;
  display: block;
  padding: 1rem 0;

  border-bottom: 1px solid @c100;
}

.menu-secundário__link-selecionado {
  border-bottom: 4px solid #F7C234;
}
</style>
