<script lang="ts" setup>
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import { PontoEndereco, useGeolocalizadorStore } from '@/stores/geolocalizador.store';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRoute } from 'vue-router';

type Emits = {
  (event: 'selecao', endereco: PontoEndereco): void
};

const emit = defineEmits<Emits>();

const route = useRoute();
const geolocalizadorStore = useGeolocalizadorStore();
const entidadesProximasStore = useEntidadesProximasStore();

const {
  enderecos, selecionado,
} = storeToRefs(geolocalizadorStore);

watch(() => route.query?.endereco, () => {
  const { endereco } = route.query as Record<string, any>;
  if (!endereco) {
    return;
  }

  entidadesProximasStore.$reset();
  enderecos.value.splice(0);
  selecionado.value = null;

  geolocalizadorStore.buscarPorEndereco(endereco);
}, { immediate: true });
</script>

<template>
  <SmaeTable
    :colunas="[
      { chave: 'seletor', atributosDaColuna: { class: 'col--minimum' } },
      { chave: 'endereco.properties.rua', label: 'endereço' },
      { chave: 'endereco.properties.bairro', label: 'bairro' },
      { chave: 'endereco.properties.cep', label: 'cep' },
    ]"
    :dados="enderecos"
  >
    <template #cabecalho:seletor />
    <template #celula:seletor="{ linha }">
      <input
        v-model="selecionado"
        type="radio"
        class="inputcheckbox"
        name="endereco_selecionado"
        :value="linha"
        @change="emit('selecao', linha);"
      >
    </template>
  </SmaeTable>
</template>
