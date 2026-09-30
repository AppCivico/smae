<script setup lang="ts">
import type { VariavelGlobalItemDto, VariavelItemDto } from '@back/variavel/entities/variavel.entity';
import { storeToRefs } from 'pinia';
import { defineProps } from 'vue';
import { useRoute } from 'vue-router';

import dateToField from '@/helpers/dateToField';
import truncate from '@/helpers/texto/truncate';
import { useAuthStore } from '@/stores/auth.store';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store';

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
const variaveisGlobaisStore = useVariaveisGlobaisStore();

const {
  temPermissãoPara,
  sistemaCorrente,
} = storeToRefs(authStore);

function foiCriadaNoSistemaCorrente(planoId: number) {
  const tipoDoPlano = variaveisGlobaisStore.planosPorId[planoId]?.tipo;

  switch (tipoDoPlano) {
    case 'PDM':
      return sistemaCorrente.value === 'PDM'
        || sistemaCorrente.value === 'ProgramaDeMetas';

    case 'PS':
      return sistemaCorrente.value === 'PlanoSetorial';

    default:
      return false;
  }
}

</script>
<template>
  <td class="cell--nowrap tr">
    <span
      v-if="$props.linha?.suspendida || $props.linha?.suspendida_em"
      class="tipinfo right"
    >
      <svg
        width="24"
        height="24"
        color="#F2890D"
      ><use xlink:href="#i_alert" /></svg><div>
        Suspensa do monitoramento físico
        <template v-if="$props.linha?.suspendida_em">
          em {{ dateToField($props.linha?.suspendida_em) }}
        </template>
      </div>
    </span>
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
      :title="$props.linha.orgao_responsal_coleta?.sigla || $props.linha.orgao?.descricao"
    >
      {{
        $props.linha.orgao_responsal_coleta?.sigla
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
        <SmaeLink
          :desabilitar="!temPermissãoPara([
            'CadastroPS.administrador',
            'CadastroPDM.administrador',
            'CadastroPS.administrador_no_orgao',
            'CadastroPDM.administrador_no_orgao',
          ])
            || !foiCriadaNoSistemaCorrente(plano.id)"
          exibir-desabilitado
          :to="{
            name: `${route.meta.entidadeMãe}.planosSetoriaisResumo`,
            params: { planoSetorialId: plano.id }
          }"
          :title="plano.nome?.length > 36 ? plano.nome : null"
        >
          {{ truncate(plano.nome, 36) }}
        </SmaeLink>
      </li>
    </ul>
    <template v-else>
      -
    </template>
  </td>
</template>
