<script lang="ts" setup>
import { debounce } from 'lodash';
import { storeToRefs } from 'pinia';
import { onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import { PontoEndereco, useGeolocalizadorStore } from '@/stores/geolocalizador.store';

type Emits = {
  (event: 'selecao', payload: { endereco: PontoEndereco, raio: number }): void
};

const emit = defineEmits<Emits>();

const limitesDeRaio = {
  minimo: 100,
  maximo: 10000,
};

const route = useRoute();
const geolocalizadorStore = useGeolocalizadorStore();
const entidadesProximasStore = useEntidadesProximasStore();

const {
  enderecos, selecionado, chamadasPendentes,
} = storeToRefs(geolocalizadorStore);

const raio = ref(2000);
const raioErro = ref('');

const emitirSelecao = debounce(() => {
  const valor = Number(raio.value);

  if (Number.isNaN(valor) || valor <= 0) {
    raioErro.value = 'O raio deve ser um número positivo.';
    return;
  }

  if (valor < limitesDeRaio.minimo || valor > limitesDeRaio.maximo) {
    raioErro.value = `O raio deve estar entre ${limitesDeRaio.minimo} m e ${limitesDeRaio.maximo} m.`;
    return;
  }

  raioErro.value = '';

  if (selecionado.value) {
    emit('selecao', { endereco: selecionado.value, raio: valor });
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

onUnmounted(() => {
  geolocalizadorStore.$reset();
  entidadesProximasStore.$reset();
});
</script>

<template>
  <template v-if="enderecos.length">
    <SmaeTable
      :colunas="[
        { chave: 'seletor', atributosDaColuna: { class: 'col--minimum' } },
        { chave: 'endereco.properties.rua', label: 'endereço' },
        { chave: 'endereco.properties.bairro', label: 'bairro' },
        { chave: 'endereco.properties.cep', label: 'cep' },
      ]"
      :dados="enderecos"
      class="fb0 f1 mb1 rolavel-verticalmente"
    >
      <template #cabecalho:seletor />
      <template #celula:seletor="{ linha }">
        <input
          v-model="selecionado"
          type="radio"
          class="inputcheckbox"
          name="endereco_selecionado"
          :value="linha"
          :disabled="!!raioErro"
          @change="emitirSelecao"
        >
      </template>
    </SmaeTable>

    <div class="flex g1 center">
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
        :min="limitesDeRaio.minimo"
        :max="limitesDeRaio.maximo"
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

    <div
      v-if="raioErro"
      class="error-msg"
      role="alert"
    >
      {{ raioErro }}
    </div>
  </template>
  <ErrorComponent
    v-else-if="!chamadasPendentes.buscandoEndereco && $route.query.endereco"
    erro="Nenhum endereço encontrado. Tente refazer sua busca."
  />
</template>
