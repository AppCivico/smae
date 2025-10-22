<script lang="ts" setup>
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import { PontoEndereco, useGeolocalizadorStore } from '@/stores/geolocalizador.store';
import { debounce } from 'lodash';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

type Emits = {
  (event: 'selecao', payload: { endereco: PontoEndereco, raio: number }): void
};

const emit = defineEmits<Emits>();

const route = useRoute();
const geolocalizadorStore = useGeolocalizadorStore();
const entidadesProximasStore = useEntidadesProximasStore();

const {
  enderecos, selecionado,
} = storeToRefs(geolocalizadorStore);

const raio = ref(2000);

const emitirSelecao = debounce(() => {
  if (!raio.value) {
    raio.value = 2000;
  }
  if (selecionado.value) {
    emit('selecao', { endereco: selecionado.value, raio: raio.value });
  }
}, 500);

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
  <div class="flex g1 center mb1">
    <label
      for="raio"
      class="label tc300 mb0"
    >
      Raio (m)
    </label>
    <input
      id="raio"
      v-model="raio"
      class="inputtext light f1"
      name="raio"
      type="number"
      min="100"
      max="10000"
      step="100"
      :aria-disabled="!enderecos.length"
      list="sugestoes-raio"
      @change="emitirSelecao"
    >
    <datalist id="sugestoes-raio">
      <option value="100">
        100 m
      </option>
      <option value="500">
        500 m
      </option>
      <option value="1000">
        1 km
      </option>
      <option value="2000">
        2 km
      </option>
      <option value="5000">
        5 km
      </option>
    </datalist>
  </div>

  <SmaeTable
    :colunas="[
      { chave: 'seletor', atributosDaColuna: { class: 'col--minimum' } },
      { chave: 'endereco.properties.rua', label: 'endereço' },
      { chave: 'endereco.properties.bairro', label: 'bairro' },
      { chave: 'endereco.properties.cep', label: 'cep' },
    ]"
    :dados="enderecos"
    class="fb0 f1 rolavel-verticalmente"
  >
    <template #cabecalho:seletor />
    <template #celula:seletor="{ linha }">
      <input
        v-model="selecionado"
        type="radio"
        class="inputcheckbox"
        name="endereco_selecionado"
        :value="linha"
        @change="emit('selecao', { endereco: linha, raio: raio });"
      >
    </template>
  </SmaeTable>
</template>
