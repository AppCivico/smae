<script setup>
import { computed, defineOptions } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

defineOptions({
  inheritAttrs: false,
});

const authStore = useAuthStore();

const { temPermissãoPara } = authStore;

const rotaCorrente = useRoute();

const props = defineProps({
  ...RouterLink.props,
  prefixoDosCaminhos: {
    type: String,
    default: undefined,
  },
  sufixoDosCaminhos: {
    type: String,
    default: undefined,
  },
  desabilitar: {
    type: Boolean,
    default: false,
  },
  exibirDesabilitado: {
    type: Boolean,
    default: false,
  },
  download: {
    type: Boolean,
    default: undefined,
  },
});

const prefixoDosCaminhos = props.prefixoDosCaminhos !== undefined
  ? props.prefixoDosCaminhos
  : rotaCorrente.meta.prefixoDosCaminhos
  || '';

const sufixoDosCaminhos = props.sufixoDosCaminhos !== undefined
  ? props.sufixoDosCaminhos
  : rotaCorrente.meta.sufixoDosCaminhos
  || '';

const isExternalLink = computed(() => (typeof props.to === 'string' && props.to.startsWith('http'))
  || props.download);

const propriedadesManipuladas = computed(() => {
  let { to } = props;

  if (typeof to === 'string') {
    to = prefixoDosCaminhos + (to.startsWith('/') ? '' : '/') + to + (to.endsWith('/') ? '' : '/') + sufixoDosCaminhos;
  } else if (typeof to.path === 'string') {
    to.path = prefixoDosCaminhos + (to.path.startsWith('/') ? '' : '/') + to.path + (to.path.endsWith('/') ? '' : '/') + sufixoDosCaminhos;
  } else if (typeof to.name === 'string' && to.name.startsWith('.')) {
    if (rotaCorrente.meta.entidadeMãe) {
      to.name = rotaCorrente.meta.entidadeMãe + to.name;
    } else {
      throw new Error('Não foi possível determinar a entidade mãe da rota corrente, mas ela é exigida para rotas que começam com `.`.');
    }
  }

  return {
    ...props,
    prefixoDosCaminhos: undefined,
    sufixoDosCaminhos: undefined,
    to,
  };
});
</script>
<template>
  <a
    v-if="isExternalLink"
    v-bind="$attrs"
    :href="$props.to"
    target="_blank"
  >
    <slot />
  </a>
  <router-link
    v-else
    v-slot="{ href, navigate, route }"
    v-bind="propriedadesManipuladas"
    custom
  >
    <a
      v-if="
        !$props.desabilitar
          && (
            !route.meta?.limitarÀsPermissões
            || temPermissãoPara(route.meta.limitarÀsPermissões)
          )
      "
      v-bind="$attrs"
      :href="href"
      @click="navigate"
    >
      <slot />
    </a>
    <span
      v-else-if="$props.desabilitar || $props.exibirDesabilitado"
      v-bind="$attrs"
    >
      <slot />
    </span>
  </router-link>
</template>
