<script setup>
import { computed, watch } from 'vue';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { storeToRefs } from 'pinia';

const props = defineProps({
  ano: {
    type: Number,
    required: true,
  },
  lista: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const DotaçãoStore = useDotaçãoStore();
const {
  DotaçãoSegmentos,
  ÓrgãosPorAnoPorCódigo,
  UnidadesPorAnoPorCódigo,
} = storeToRefs(DotaçãoStore);

const prefixoEscolhido = computed({
  get() {
    return props.modelValue;
  },
  set(valor) {
    emit('update:modelValue', valor);
  },
});

const listaDeOpções = computed(() => props.lista
  .reduce((acc, cur) => {
    const [idDoÓrgão, idDaUnidade] = cur.parte_dotacao
      ? cur.parte_dotacao.split('.')
      : cur.dotacao.split('.');
    const nomeDoÓrgão = ÓrgãosPorAnoPorCódigo.value?.[props.ano]?.[idDoÓrgão]?.descricao;
    const nomeDaUnidade = UnidadesPorAnoPorCódigo.value?.[props.ano]?.[idDaUnidade]?.descricao;

    const chave = [idDoÓrgão, idDaUnidade].join('.');

    if (!acc[idDoÓrgão]) {
      acc[idDoÓrgão] = {
        etiqueta: idDoÓrgão,
        chave: idDoÓrgão,
        filhas: {},
      };

      if (nomeDoÓrgão) {
        acc[idDoÓrgão].etiqueta += ` - ${nomeDoÓrgão} `;
      }
    }

    if (!acc[idDoÓrgão].filhas[idDaUnidade]) {
      acc[idDoÓrgão].filhas[idDaUnidade] = {
        etiqueta: `${idDoÓrgão}.${idDaUnidade}`,
        valor: chave,
      };

      if (nomeDaUnidade) {
        acc[idDoÓrgão].filhas[idDaUnidade].etiqueta += ` - ${nomeDaUnidade}`;
      }
    }
    return acc;
  }, {}));

if (!DotaçãoSegmentos?.value?.[props.ano]) {
  DotaçãoStore.getDotaçãoSegmentos(props.ano);
}

watch(() => props.lista, () => {
  emit('update:modelValue', '');
});

emit('update:modelValue', prefixoEscolhido.value);
</script>

<template>
  <form
    class="f1 search"
    @submit.prevent
  >
    <label
      class="label tc300"
      for="prefixo-escolhido"
    >Filtrar por dotação</label>

    <select
      id="prefixo-escolhido"
      v-model="prefixoEscolhido"
      name="prefixo-escolhido"
      class="inputtext"
    >
      <option value="" />
      <optgroup
        v-for="(item, key) in listaDeOpções"
        :key="key"
        :label="item.etiqueta"
      >
        <option
          v-for="filha in item.filhas"
          :key="filha.valor"
          :value="filha.valor"
        >
          {{ filha.etiqueta }}
        </option>
      </optgroup>
    </select>

    <small class="tc200 t13">ocorre nos dados já baixados</small>
  </form>
</template>
<style lang="less">
</style>
