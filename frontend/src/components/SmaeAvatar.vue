<script setup>
import Avatar from 'vue-boring-avatars';

import useFaixaConstrucao from '@/composables/useEnvironmentBanner';

defineProps({
  name: {
    type: [
      String,
      Number,
    ],
    default: null,
  },
  nomeExibicao: {
    type: String,
    default: null,
  },
  size: {
    type: Number,
    default: 40,
  },
  variant: {
    type: String,
    default: 'beam',
  },
  colors: {
    type: Array,
    default: () => [
      '#152741',
      '#f7c234',
      '#f7f7f7',
      '#3b5881',
      '#061223',
    ],
  },
});

const { corDaFaixa } = useFaixaConstrucao();
</script>

<template>
  <div class="h-card">
    <Avatar
      class="u-photo"
      :size="$props.size"
      :variant="$props.variant"
      :name="$props.name"
      :colors="$props.colors"
    />
    <span
      v-if="$props.nomeExibicao"
      class="p-name"
    >
      {{ $props.nomeExibicao }}
    </span>

    <component
      :is="`style`"
      v-if="corDaFaixa"
    >
      .dev-environment:root {
        --avatar-color: {{ corDaFaixa }} !important;
      }
    </component>
  </div>
</template>

<style lang="less" scoped>
.h-card {
  filter: drop-shadow(0 4px 4px fade(@c600, 65%));

  display: flex;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.u-photo {
  border: 4px solid white;
  border-radius: 999em;
  box-shadow: 0 0 0 0.5rem var(--avatar-color, @amarelo);
  position: relative;
}

.p-name {
  background-color: var(--avatar-color, @amarelo);
  font-size: 0.875rem;
  color: @primary;
  border-radius: 999em;
  padding: 0.5rem 1rem;
  padding-left: 40px;
  margin-left: -40px;
  font-weight: bold;
}

</style>
