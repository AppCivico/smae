<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/truncate';
import { useODSStore } from '@/stores/ods.store';
import { storeToRefs } from 'pinia';
import { useField } from 'vee-validate';
import {
  computed, onMounted, ref, watch, watchEffect,
} from 'vue';
import { useRoute } from 'vue-router';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const rota = useRoute();

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  categoriasPermitidas: {
    type: Array,
    default: () => [],
  },
  valoresIniciais: {
    type: Array,
    default: () => [],
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: '',
  },
  // parâmetros de filtragem
  pdmId: {
    type: Number,
    default: undefined,
  },
});

const emit = defineEmits(['update:modelValue']);

const categoriasStore = useODSStore();
const { ODS } = storeToRefs(categoriasStore);

function caminhoParaApi(rotaMeta) {
  if (rotaMeta.entidadeMãe === 'pdm') {
    return 'tag';
  }
  if (rotaMeta.entidadeMãe === 'planoSetorial') {
    return 'plano-setorial-tag';
  }
  throw new Error('Não foi possível identificar o módulo para buscar suas tags.');
}

const listaDeTags = ref([]);

const tagsPorId = computed(() => listaDeTags.value.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {}));

const tagsPorCategoria = computed(() => listaDeTags.value.reduce((acc, cur) => {
  if (!acc[cur.ods_id]) {
    acc[cur.ods_id] = [];
  }
  acc[cur.ods_id].push(cur);
  return acc;
}, {}));

const { handleChange } = useField(props.name, undefined, {
  initialValue: props.modelValue,
});

const categoriasDisponiveis = computed(() => {
  const categorias = Array.isArray(ODS.value) ? ODS.value : [];

  return (props.categoriasPermitidas.length && categorias
    ? categorias.filter((x) => props.categoriasPermitidas.indexOf(x.id) !== -1)
    : categorias).filter((x) => !!tagsPorCategoria.value[x.id]?.length);
});

// usar lista para manter a ordem
const listaDeCategorias = ref([]);

// usar mapa para simplificar a conferência de categorias já em uso
const mapaDeCategorias = computed(() => listaDeCategorias.value
  .reduce((acc, cur) => ({ ...acc, [cur.id]: true }), {}));

const categoriasETags = computed(() => props.modelValue.reduce((acc, cur) => {
  const chave = tagsPorId.value[cur]?.ods_id;

  if (!acc[chave]) {
    acc[chave] = {
      categoria: tagsPorId.value[cur]?.ods_id,
      tags: [],
    };
  }

  acc[chave].tags.push(cur);

  return acc;
}, {}));

function removerLinha(i) {
  const novoValor = Object.keys(categoriasETags.value)
    .reduce((acc, cur) => (listaDeCategorias.value[i].id === categoriasETags.value[cur].categoria
      ? acc
      : acc.concat(categoriasETags.value[cur].tags)), []);

  listaDeCategorias.value.splice(i, 1);
  handleChange(novoValor);
  emit('update:modelValue', novoValor);
}

function adicionarLinha() {
  listaDeCategorias.value.push({ id: 0 });
}

function adicionarTags(tags, i) {
  const novoValor = listaDeCategorias.value
    // eslint-disable-next-line max-len
    .reduce((acc, cur) => (listaDeCategorias.value[i].id === categoriasETags.value[cur.id]?.categoria
      || !categoriasETags.value[cur.id]
      ? acc.concat(tags)
      : acc.concat(categoriasETags.value[cur.id].tags)
    ), []);

  handleChange(novoValor);
  emit('update:modelValue', novoValor);
}

async function montar() {
  if (!Array.isArray(ODS.value) || !ODS.value.length) {
    await categoriasStore.getAll();
  }

  listaDeCategorias.value = Object.values(props.valoresIniciais.reduce((acc, cur) => {
    // usando reduce e um mapa para evitar o trabalho de remover duplicatas
    const chaveDaCategoria = `_${tagsPorId.value[cur]?.ods_id}`;
    if (!acc[chaveDaCategoria]) {
      acc[chaveDaCategoria] = { id: tagsPorId.value[cur]?.ods_id };
    }
    return acc;
  }, {}));
}

// assistindo mounted apenas para facilitar o desenvolvimento
onMounted(() => {
  montar();
});

watchEffect(async () => {
  const caminho = caminhoParaApi(rota.meta);
  const { linhas } = await requestS.get(`${baseUrl}/${caminho}`, {
    pdm_id: props.pdmId,
  });

  if (Array.isArray(linhas)) {
    listaDeTags.value = linhas;
    montar();
  } else {
    throw new Error('lista de tags entregue fora do padrão esperado');
  }
});

watch(() => props.valoresIniciais, () => {
  montar();
}, { immediate: true });
</script>
<template>
  <div class="campo-de-tags">
    <div
      v-for="(item, idx) in listaDeCategorias"
      :key="item.id"
      class="flex flexwrap g2 mb1"
    >
      <div class="f1">
        <label
          :for="`categoria--${idx}`"
          class="label"
        >Categoria</label>
        <select
          :id="`categoria--${idx}`"
          v-model="listaDeCategorias[idx].id"
          class="inputtext light"
          :disabled="categoriasETags[item.id]?.tags.length"
        >
          <option value="" />
          <option
            v-for="categoria in categoriasDisponiveis"
            :key="`${item.categoria}__categoria--${categoria.id}`"
            :value="categoria.id"
            :title="categoria.titulo?.length > 36 ? categoria.titulo : undefined"
            :disabled="mapaDeCategorias[categoria.id] && listaDeCategorias[idx].id !== categoria.id"
          >
            {{ categoria.descricao }} - {{ truncate(categoria.titulo, 36) }}
          </option>
        </select>
      </div>

      <div class="f3">
        <label
          :for="`tags--${idx}`"
          class="label"
        >Tags</label>
        <AutocompleteField
          :id="`tags--${idx}`"
          :controlador="{
            busca: '',
            participantes: categoriasETags[item.id]?.tags || []
          }"
          :model-value="categoriasETags[item.id]?.tags"
          :grupo="tagsPorCategoria[listaDeCategorias[idx].id] || []"
          label="descricao"
          @change="($newValue) => { adicionarTags($newValue, idx); }"
        />
      </div>

      <button
        class="like-a__text addlink"
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

    <button
      class="like-a__text addlink"
      type="button"
      :disabled="!categoriasDisponiveis.length
        || categoriasDisponiveis.length === listaDeCategorias.length"
      @click="adicionarLinha"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg>Adicionar tag
    </button>

    <div
      v-if="!categoriasDisponiveis.length"
      class="error p1 error-msg"
    >
      Não há tags nas categorias disponíveis.
    </div>

    <pre v-ScrollLockDebug>props.modelValue:{{ props.modelValue }}</pre>
  </div>
</template>
