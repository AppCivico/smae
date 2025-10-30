<script setup>
import { computed } from 'vue';

const props = defineProps({
  caption: {
    type: String,
    default: '',
  },
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
    default: () => ({}),
  },
});

const temCabeçalho = computed(() => props.colunas.some((x) => x.etiqueta));
</script>
<template>
  <table class="tablemain">
    <caption v-if="caption">
      {{ caption }}
    </caption>
    <col
      v-for="coluna, i in colunas"
      :key="`col__${i}`"
      :class="coluna.classe || undefined"
    >

    <thead v-if="temCabeçalho">
      <tr>
        <th
          v-for="coluna, i in colunas"
          :key="`header__${i}`"
        >
          <!--
            vamos usar `etiqueta` e reservar a propriedade `texto` para padrão nas células
            Assim, podemos ter coluna sem cabeçalho
           -->
          {{ coluna.etiqueta || null }}
        </th>
      </tr>
    </thead>

    <tbody>
      <template v-if="lista.length">
        <tr
          v-for="item, idx in lista"
          :key="item.id ?? idx"
          :class="item.classe || undefined"
        >
          <component
            :is="(coluna.éCabeçalho || item.éCabeçalho) ? 'th' : 'td'"
            v-for="coluna, i in colunas"
            :key="`cel__${i}--${item.id}`"
            :class="item[coluna.nomeDaPropriedade]?.classe || undefined"
          >
            <a
              v-if="item[coluna.nomeDaPropriedade]?.href"
              :href="item[coluna.nomeDaPropriedade].href"
              :download="item[coluna.nomeDaPropriedade].download ?? undefined"
            >
              {{ item[coluna.nomeDaPropriedade].texto ?? item[coluna.nomeDaPropriedade] }}
            </a>
            <router-link
              v-else-if="item[coluna.nomeDaPropriedade]?.rota"
              :to="item[coluna.nomeDaPropriedade].rota"
              :title="item[coluna.nomeDaPropriedade]?.texto || coluna.texto || undefined"
            >
              <svg
                v-if="item[coluna.nomeDaPropriedade]?.svgId || coluna.svgId"
                width="20"
                height="20"
              >
                <use :xlink:href="`#i_${item[coluna.nomeDaPropriedade]?.svgId || coluna.svgId}`" />
              </svg>
              <template v-else>
                {{ item[coluna.nomeDaPropriedade].texto
                  ?? coluna.texto
                  ?? item[coluna.nomeDaPropriedade] }}
              </template>
            </router-link>
            <button
              v-else-if="item[coluna.nomeDaPropriedade]?.ação"
              class="like-a__text addlink"
              :aria-label="item[coluna.nomeDaPropriedade]?.texto || undefined"
              :title="item[coluna.nomeDaPropriedade]?.texto || coluna.texto || undefined"
              @click="() => item[coluna.nomeDaPropriedade]?.ação()"
            >
              <svg
                v-if="item[coluna.nomeDaPropriedade]?.svgId || coluna.svgId"
                width="20"
                height="20"
              >
                <use :xlink:href="`#i_${item[coluna.nomeDaPropriedade]?.svgId || coluna.svgId}`" />
              </svg>
              <template v-else>
                {{ item[coluna.nomeDaPropriedade]?.texto ?? coluna.texto }}
              </template>
            </button>
            <template v-else>
              {{ item[coluna.nomeDaPropriedade] }}
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
