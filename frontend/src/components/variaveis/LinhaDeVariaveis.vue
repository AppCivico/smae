<template>
  <td class="cell--nowrap">
    {{ $props.linha?.codigo }}
  </td>
  <th>
    <code v-scrollLockDebug>{{ $props.linha?.id }}</code>
    {{ $props.linha?.titulo }}
  </th>
  <td>
    {{ $props.linha?.fonte?.nome || $props.linha?.fonte || '-' }}
  </td>
  <td class="cell--nowrap">
    {{ $props.linha?.periodicidade }}
  </td>
  <td class="cell--nowrap">
    <abbr
      v-if="$props.linha?.orgao_responsal_coleta || $props.linha?.orgao"
      :title="$props.linha.orgao_responsal_coleta.sigla || $props.linha.orgao.descricao"
    >
      {{
        $props.linha.orgao_responsal_coleta.sigla
          || $props.linha?.orgao_responsal_coleta
          || $props.linha?.orgao.sigla
          || $props.linha?.orgao
      }}
    </abbr>
  </td>
  <td class="contentStyle">
    <ul v-if="Array.isArray($props.linha?.planos) && $props.linha?.planos.length">
      <li
        v-for="plano in $props.linha?.planos"
        :key="plano.id"
      >
        <component
          :is="temPermissãoPara([
            'CadastroPS.administrador',
            'CadastroPDM.administrador',
            'CadastroPS.administrador_no_orgao',
            'CadastroPDM.administrador_no_orgao',
          ])
            ? 'router-link'
            : 'span'"
          :to="{
            name: `${route.meta.entidadeMãe}.planosSetoriaisResumo`,
            params: { planoSetorialId: plano.id }
          }"
          :title="plano.nome?.length > 36 ? plano.nome : null"
        >
          {{ truncate(plano.nome, 36) }}
        </component>
      </li>
    </ul>
    <template v-else>
      -
    </template>
  </td>
</template>
<script setup lang="ts">
import type { VariavelGlobalItemDto, VariavelItemDto } from '@/../../backend/src/variavel/entities/variavel.entity';
import { storeToRefs } from 'pinia';
import { defineProps } from 'vue';
import { useRoute } from 'vue-router';
import truncate from '@/helpers/texto/truncate';
import { useAuthStore } from '@/stores/auth.store';

defineOptions({
  inheritAttrs: false,
});

defineProps({
  linha: {
    type: Object as () => VariavelGlobalItemDto | VariavelItemDto,
    default: null,
  },
});

const route = useRoute();

const authStore = useAuthStore();

const { temPermissãoPara } = storeToRefs(authStore);
</script>
