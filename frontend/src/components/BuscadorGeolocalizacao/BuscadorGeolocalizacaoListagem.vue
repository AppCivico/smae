<script lang="ts" setup>
import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { PontoEndereco, useGeolocalizadorStore } from '@/stores/geolocalizador.store';

type Emits = {
  (event: 'selecao', endereco: PontoEndereco): void
};

const emit = defineEmits<Emits>();

const route = useRoute();
const geolocalizadorStore = useGeolocalizadorStore();

const { enderecos } = storeToRefs(geolocalizadorStore);

function selecionarEndereco(endereco: PontoEndereco) {
  emit('selecao', endereco);

  geolocalizadorStore.selecionarEndereco(endereco);
}

watch(() => route.query?.endereco, () => {
  const { endereco } = route.query as Record<string, any>;
  if (!endereco) {
    return;
  }

  geolocalizadorStore.buscarPorEndereco(endereco);
}, { immediate: true });
</script>

<template>
  <div>
    <SmaeTable
      :colunas="[
        { chave: 'seletor', atributosDaColuna: { class: 'col--minimum'} },
        { chave: 'endereco.properties.rua', label: 'endereço' },
        { chave: 'endereco.properties.bairro', label: 'bairro' },
        { chave: 'endereco.properties.cep', label: 'cep' },
      ]"
      :dados="enderecos"
    >
      <template #cabecalho:seletor />
      <template #celula:seletor="{ linha }">
        <input
          type="radio"
          class="inputcheckbox"
          name="endereco_selecionado"
          :value="linha"
          @change="selecionarEndereco(linha)"
        >
      </template>
    </SmaeTable>
  </div>
</template>
