<script setup>
import { useRegionsStore } from '@/stores/regions.store';
import { storeToRefs } from 'pinia';
import { useField } from 'vee-validate';
import {
  computed,
  ref,
  toRef,
  watch,
} from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  valoresIniciais: {
    type: Array,
    required: true,
  },
  nível: {
    type: Number,
    required: true,
    default: 0,
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const regionsStore = useRegionsStore();
const {
  regions: regiões, regiõesPorId, regiõesPorNível, regiõesPorMãe,
} = storeToRefs(regionsStore);

const nomeDoCampo = toRef(props, 'name');
const nívelDoCampo = toRef(props, 'nível');

const { handleChange } = useField(nomeDoCampo.value, undefined, {
  initialValue: props.modelValue,
});

// usar lista para manter a ordem
const lista = ref([]);

const listaDeRegiões = computed(() => lista.value
  .reduce((acc, cur) => acc.concat(cur.agrupadora || []).concat(cur.regiões), []));

const mapaDeAgrupadores = computed(() => lista.value.reduce((acc, cur) => {
  acc[cur.agrupadora] = true;
  return acc;
}, {}));

const agrupadoresDisponíveis = computed(() => regiõesPorNível.value[nívelDoCampo.value] || []);

function removerLinha(índice) {
  lista.value.splice(índice, 1);
}

function adicionarLinha() {
  lista.value.push({
    agrupadora: 0,
    regiões: [],
  });
}

async function montar() {
  if (!regiões.value.length) {
    await regionsStore.getAll();
  }

  if (props.valoresIniciais) {
    const agrupadas = {};

    props.valoresIniciais.forEach((id) => {
      if (regiõesPorId.value[id]?.nivel === nívelDoCampo.value) {
        agrupadas[id] = {
          agrupadora: id,
          regiões: [],
        };
      }
    });

    props.valoresIniciais.forEach((id) => {
      const idDaMãe = regiõesPorId.value[id]?.parente_id;

      if (agrupadas[idDaMãe]) {
        agrupadas[idDaMãe].regiões.push(id);
      }
    });

    lista.value.splice(0, lista.value.length, ...Object.values(agrupadas));
  }
}

watch(() => [props.valoresIniciais, props.nível], (novoValor) => {
  montar();
}, { immediate: true });

watch(() => listaDeRegiões.value, (novoValor) => {
  handleChange(novoValor);
  emit('update:modelValue', novoValor);
});
</script>
<template>
  <div class="campo-de-regiões">
    <div v-ScrollLockDebug>
      <pre>modelValue:{{ modelValue }}</pre>
      <pre>nível:{{ nível }}</pre>
      <pre>lista:{{ lista }}</pre>
      <pre>listaDeRegiões:{{ listaDeRegiões }}</pre>
    </div>

    <div
      v-for="(item, idx) in lista"
      :key="item.id"
      class="mb2"
    >
      <div class="flex g2 mb1 center">
        <div class="f1">
          <label
            :for="`região--${idx}`"
            class="label"
          >Região</label>
          <select
            :id="`região--${idx}`"
            v-model="lista[idx].agrupadora"
            class="inputtext light"
            @change="lista[idx].regiões.splice(0, lista[idx].regiões.length)"
          >
            <option
              value=""
              disabled
            />
            <option
              v-for="região in agrupadoresDisponíveis"
              :key="região.id"
              :value="região.id"
              :disabled="mapaDeAgrupadores[região.id] && lista[idx].agrupadora !== região.id"
            >
              {{ região.descricao }}
            </option>
          </select>
        </div>

        <div class="f0 mt1">
          <button
            class="like-a__text addlink"
            type="button"
            aria-label="excluir"
            title="excluir"
            @click="removerLinha(idx)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </div>
      </div>

      <ul
        v-if="regiõesPorMãe[lista[idx].agrupadora]?.length"
        class="flex flexwrap  g2 mb1"
      >
        <li
          v-for="r in regiõesPorMãe[item.agrupadora]"
          :key="r.id"
        >
          <label
            class="tc600 lista-de-opções__item"
            :for="`região__${r.id}`"
          >
            <input
              :id="`região__${r.id}`"
              :key="`região__${r.id}`"
              v-model="lista[idx].regiões"
              :value="r.id"
              type="checkbox"
              class="inputcheckbox"
            >
            <span>
              {{ r.descricao }}
            </span>
          </label>
        </li>
      </ul>
    </div>

    <button
      class="like-a__text addlink"
      type="button"
      :disabled="agrupadoresDisponíveis.length === lista.length"
      @click="adicionarLinha"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg>Adicionar região
    </button>

    <div
      v-if="!agrupadoresDisponíveis.length"
      class="error p1 error-msg"
    >
      Não há regiões disponíveis.
    </div>

    <pre v-ScrollLockDebug>props.modelValue:{{ props.modelValue }}</pre>
  </div>
</template>
