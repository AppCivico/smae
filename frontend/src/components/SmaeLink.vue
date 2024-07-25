<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { computed, defineOptions } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

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
});

const prefixoDosCaminhos = props.prefixoDosCaminhos !== undefined
  ? props.prefixoDosCaminhos
  : rotaCorrente.meta.prefixoDosCaminhos
  || '';
const sufixoDosCaminhos = props.sufixoDosCaminhos !== undefined
  ? props.sufixoDosCaminhos
  : rotaCorrente.meta.sufixoDosCaminhos
  || '';

const isExternalLink = computed(() => typeof props.to === 'string' && props.to.startsWith('http'));

const propriedadesManipuladas = computed(() => {
  let { to } = props;

  if (typeof to === 'string') {
    to = prefixoDosCaminhos + (to.startsWith('/') ? '' : '/') + to + (to.endsWith('/') ? '' : '/') + sufixoDosCaminhos;
  } else if (typeof to.path === 'string') {
    to.path = prefixoDosCaminhos + (to.path.startsWith('/') ? '' : '/') + to.path + (to.path.endsWith('/') ? '' : '/') + sufixoDosCaminhos;
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
      v-if="!route.meta?.limitarÀsPermissões
        || temPermissãoPara(route.meta.limitarÀsPermissões)"
      v-bind="$attrs"
      :href="href"
      @click="navigate"
    >
      <slot />
    </a>
  </router-link>
</template>
