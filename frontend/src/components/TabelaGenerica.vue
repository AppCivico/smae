<script setup>
defineProps({
  colunas: {
    type: Array,
    required: true,
  },
  erro: {
    type: Error,
    default: null,
  },
  lista: {
    type: Array,
    required: true,
  },
  chamadasPendentes: {
    type: Object,
    default: () => { },
  },
});
</script>
<template>
  <table class="tablemain">
    <col
      v-for="coluna, i in colunas"
      :key="`col__${i}`"
      :class="coluna.classe || null"
    >

    <thead>
      <tr>
        <th
          v-for="coluna, i in colunas"
          :key="`header__${i}`"
        >
          {{ coluna.etiqueta || null }}
        </th>
      </tr>
    </thead>

    <tbody>
      <template v-if="lista.length">
        <tr
          v-for="item in lista"
          :key="item.id"
        >
          <component
            :is="coluna.éCabeçalho ? 'th' : 'td'"
            v-for="coluna, i in colunas"
            :key="`cel__${i}--${item.id}`"
          >
            <a
              v-if="item[coluna.nome]?.href"
              :href="item[coluna.nome].href"
              :download="item[coluna.nome].download || null"
            >
              {{ item[coluna.nome].texto ?? item[coluna.nome] }}
            </a>
            <router-link
              v-else-if="item[coluna.nome]?.rota"
              :to="item[coluna.nome].rota"
            >
              {{ item[coluna.nome].texto ?? item[coluna.nome] }}
            </router-link>
            <template v-else>
              {{ item[coluna.nome] }}
            </template>
          </component>
        </tr>
      </template>
      <tr v-else-if="!chamadasPendentes.lista">
        <td :colspan="colunas.length">
          Nenhum resultado encontrado.
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td
          :colspan="colunas.length"
          aria-busy="true"
        >
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td :colspan="colunas.length">
          {{ erro }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
