<script setup>
defineProps({
  group: {
    type: Object,
    required: true,
  },
  permissao: {
    type: Boolean,
    required: true,
  },
  parentlink: {
    type: String,
    default: '',
  },
  órgãoEUnidadeSelecionados: {
    type: String,
    default: '',
  },
});
function formataValor(d) {
  return Number(d).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }) ?? d;
}
</script>
<template>
  <tr
    v-for="item in group.items"
    :key="item.id"
  >
    <td style="word-break: break-all;">
      {{ item?.dotacao }}
    </td>
    <td>{{ formataValor(item?.valor_planejado) }}</td>
    <td :class="{ 'w700 tvermelho': item?.pressao_orcamentaria }">
      {{ formataValor(item?.pressao_orcamentaria_valor) }}
    </td>
    <td style="white-space: nowrap; text-align: right">
      <SmaeLink
        v-if="permissao && ($route.meta?.rotaParaEdição || parentlink)"
        :to="$route.meta?.rotaParaEdição
          ? { name: $route.meta.rotaParaEdição, params: { ano: item.ano_referencia, id: item.id } }
          : `${parentlink}/orcamento/planejado/${item.ano_referencia}/${item.id}`"
        class="tprimary"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_edit" /></svg>
      </SmaeLink>
    </td>
  </tr>
</template>
