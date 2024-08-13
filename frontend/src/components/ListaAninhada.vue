<script setup>
defineProps({
  as: {
    type: String,
    default: 'ul',
    validator: (value) => ['ul', 'ol'].includes(value),
  },
  lista: {
    type: Array,
    default: () => [],
    validator: (value) => Array.isArray(value),
  },
  nivel: {
    type: Number,
    default: 1,
  },
  nomeDasFilhas: {
    type: String,
    default: 'children',
  },
  nomeDoTexto: {
    type: String,
    default: 'name',
  },
});
</script>
<template>
  <component :is="$props.as">
    <li
      v-for="item, idx in lista"
      :key="item.id ?? idx"
    >
      <slot
        :item="item"
        :nivel="$props.nivel"
      >
        {{ item[$props.nomeDoTexto] }}
      </slot>
      <ListaAninhada
        v-if="item[$props.nomeDasFilhas]?.length"
        :lista="item[$props.nomeDasFilhas]"
        :nome-das-filhas="nomeDasFilhas"
        :nome-do-texto="nomeDoTexto"
        :nivel="nivel + 1"
      />
    </li>
  </component>
</template>
