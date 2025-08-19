<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import truncate from '@/helpers/texto/truncate';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const router = useRouter();

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

const rotasParaMigalhasDePão = computed(() => {
  const listaDeRotas = typeof route.meta?.rotasParaMigalhasDePão === 'function'
    ? route.meta.rotasParaMigalhasDePão()
    : route.meta?.rotasParaMigalhasDePão;

  return listaDeRotas
    ? limparRotas(listaDeRotas)
    : [];
});

const rotaTemDetalhe = computed(() => {
  const ultimaRota = rotasParaMigalhasDePão.value[rotasParaMigalhasDePão.value.length - 1];

  return ultimaRota.name === route.name;
});

</script>
<template>
  <nav
    v-if="rotasParaMigalhasDePão.length"
    class="migalhas-de-pão"
  >
    <ul class="migalhas-de-pão__lista">
      <li
        v-for="item, k in rotasParaMigalhasDePão"
        :key="k"
        class="migalhas-de-pão__item"
      >
        <component
          :is="item.name === $route.name ? 'span' : 'RouterLink'"
          :class="[
            {'migalhas-de-pão__link': item.name !== $route.name},
          ]"
          :to="item.href"
        >
          {{
            truncate(
              item.meta?.tituloParaMigalhaDePao && (
                typeof item.meta.tituloParaMigalhaDePao === 'function' ?
                  item.meta.tituloParaMigalhaDePao()
                  : item.meta.tituloParaMigalhaDePao
              )
                || item.meta?.títuloParaMenu
                || item.meta.título && (
                  typeof item.meta.título === 'function' ?
                    item.meta.título()
                    : item.meta.título
                )
                || item.name
              , 50)
          }}
        </component>
      </li>
      <li
        class="migalhas-de-pão__item"
      >
        <!--
        /**
        * @doc
        *
        * As telas com permissão mais aberta estão na rota mais interna na hierarquia.
        * Então, é possível que alguém tenha permissão para ver a rota `/:ID/resumo`,
        * mas não a rota `/:ID`.
        *
        * Exemplo:
        * [...] / Projeto ABC [rota de resumo] / Escopo [rota de resumo]
        *
        * Essa estrutura também causa uma inversão nos últimos items da migalhas de pão:
        * o nível de cima vindo à direita do que deveria ser o nível de baixo,
        * mas não é.
        *
        * Esta abordagem resolve o desafio fazendo os 2 itens finais apontarem para a
        * mesma rota. Para isso, adicionamos o "routeName" atual à lista de migalhasDePao.
        *
        * Quando a rotaAtual for igual ao último item da lista, o componente
        * desabilita essa etapa, gerando um resultado como:
        *
        * Rota de resumo:
        * /projeto/[ID]/resumo
        * [...] / Projeto ABC [resumo/desabilitado] / Escopo [resumo/desabilitado]
        *
        * Rota de edição:
        * /projeto/[ID]
        * [...] / Projeto ABC [resumo/habilitado] / Editar [editar/desabilitado]
        */
        -->

        <template v-if="rotaTemDetalhe">
          {{ $route.meta?.títuloParaMenu || $route.name }}
        </template>

        <template v-else>
          {{
            truncate(
              $route.meta?.tituloParaMigalhaDePao && (
                typeof $route.meta.tituloParaMigalhaDePao === 'function' ?
                  $route.meta.tituloParaMigalhaDePao()
                  : $route.meta.tituloParaMigalhaDePao
              )
                || $route.meta?.títuloParaMenu
                || $route.meta?.título && (
                  typeof $route.meta?.título === 'function' ?
                    $route.meta?.título()
                    : $route.meta?.título
                )
                || $route.name
              , 50)
          }}
        </template>
      </li>
    </ul>
  </nav>
</template>
