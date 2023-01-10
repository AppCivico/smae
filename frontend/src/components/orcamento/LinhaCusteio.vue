<script setup>
import dateToField from '@/helpers/dateToField';
import formataValor from '@/helpers/formataValor';

const props = defineProps(['group', 'permissao', 'parentlink']);
</script>

<template>
  <tr
    v-for="item in group.items"
    :key="item.id"
  >
    <td style="word-break: break-all;">
      {{ item?.parte_dotacao }}
    </td>
    <td>{{ formataValor(item?.investimento_previsto) }}</td>
    <td>{{ formataValor(item?.custeio_previsto) }}</td>
    <td>{{ dateToField(item?.atualizado_em) }}</td>
    <td style="white-space: nowrap; text-align: right">
      <router-link
        v-if="permissao"
        :to="`${parentlink}/orcamento/custeio/${item.ano_referencia}/${item.id}`"
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
