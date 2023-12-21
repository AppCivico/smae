<script setup>
import dateToField from '@/helpers/dateToField';
import formataValor from '@/helpers/formataValor';

defineProps({
  group: {
    type: Array,
    required: true,
  },
  permissao: {
    type: Boolean,
    required: true,
  },
  parentlink: {
    type: String,
    required: true,
  },
  órgãoEUnidadeSelecionados: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <tr
    v-for="item in group.items"
    :key="item.id"
    :hidden="!!órgãoEUnidadeSelecionados
      && item?.parte_dotacao.indexOf(órgãoEUnidadeSelecionados) !== 0"
  >
    <td style="word-break: break-all;">
      {{ item?.parte_dotacao }}
    </td>
    <td>{{ formataValor(item?.custo_previsto) }}</td>
    <td>{{ dateToField(item?.atualizado_em) }}</td>
    <td style="white-space: nowrap; text-align: right">
      <router-link
        v-if="permissao && ($route.meta?.rotaParaEdição || parentlink)"
        :to="$route.meta?.rotaParaEdição
          ? { name: $route.meta.rotaParaEdição, params: { ano: item.ano_referencia, id: item.id } }
          : `${parentlink}/orcamento/custo/${item.ano_referencia}/${item.id}`"
        class="tprimary"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_edit" /></svg>
      </router-link>
    </td>
  </tr>
</template>
