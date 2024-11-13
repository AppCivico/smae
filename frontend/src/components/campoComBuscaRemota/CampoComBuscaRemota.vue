<template>
  <div class="flex g1">
    <output class="inputtext light output">
      <slot
        v-if="itemSelecionado"
        name="valor-exibido"
        :item="itemSelecionado"
      >
        {{ valorExibido }}
      </slot>
      <span v-else>
        Escolha uma opção
      </span>
    </output>
    <button
      class="btn"
      @click="toggleModal"
    >
      {{ itemSelecionado ? 'Alterar' : 'Selecionar' }}
    </button>
  </div>

  <SmallModal
    :active="estaAberto"
    @close="toggleModal"
  >
    <form @submit.prevent="onSubmit">
      <div class="flex g1 mb2">
        <input
          id="palavra-chave"
          v-model="valorDaBusca"
          class="inputtext light"
          :name="chaveDeBusca"
          type="search"
        >
        <button
          class="btn"
          type="submit"
        >
          Buscar
        </button>
      </div>
    </form>

    <div v-if="carregando">
      Carregando...
    </div>

    <table
      v-else
      class="tablemain"
    >
      <thead>
        <tr>
          <slot name="table-header" />
        </tr>
      </thead>
      <tbody>
        <template v-if="linhas.length">
          <tr
            v-for="item in linhas"
            :key="item.id"
          >
            <slot
              name="table-data"
              v-bind="{ item }"
            />
            <td>
              <button
                class="btn bgnone outline tcprimary"
                @click="selecionarItem(item)"
              >
                Selecionar
              </button>
            </td>
          </tr>
        </template>
        <template v-else>
          <tr>
            <td colspan="100%">
              Nenhum resultado encontrado
            </td>
          </tr>
        </template>
      </tbody>
      <tfoot>
        <slot name="table-footer" />
      </tfoot>
    </table>
  </SmallModal>
</template>

<script setup>
import SmallModal from '@/components/SmallModal.vue';
import requestS from '@/helpers/requestS';
import {
  ref,
  defineProps,
  computed,
  watch,
  defineEmits,
} from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
  urlRequisicao: {
    type: String,
    required: true,
  },
  chaveDeBusca: {
    type: String,
    required: true,
  },
  chaveDeRetorno: {
    type: String,
    default: () => 'linhas',
  },
  chaveDeValor: {
    type: String,
    default: 'id',
  },
  chaveDeExibição: {
    type: String,
    default: () => 'id',
  },
  parametrosExtras: {
    type: Object,
    default: () => ({}),
  },
});

const estaAberto = ref(false);
const linhas = ref([]);
const valorDaBusca = ref('');
const itemSelecionado = ref(null);
const carregando = ref(false);

const valorExibido = computed(() => (itemSelecionado.value
  ? itemSelecionado.value[props.chaveDeExibição]
  : valorDaBusca.value));

const urlFinal = computed(() => {
  const params = new URLSearchParams();
  if (valorDaBusca.value) params.append(props.chaveDeBusca, valorDaBusca.value);

  Object.entries(props.parametrosExtras).forEach(([key, value]) => {
    params.append(key, value);
  });
  return `${baseUrl}/${props.urlRequisicao}?${params.toString()}`;
});

async function onSubmit() {
  carregando.value = true;
  try {
    const retorno = await requestS.get(urlFinal.value);
    linhas.value = retorno[props.chaveDeRetorno] || [];
  } catch (error) {
    console.error('Erro na requisição:', error);
    linhas.value = [];
  } finally {
    carregando.value = false;
  }
}

watch(itemSelecionado, (novoValor) => {
  emit('update:modelValue', novoValor?.[props.chaveDeValor]);
});

function toggleModal() {
  estaAberto.value = !estaAberto.value;
}

function selecionarItem(item) {
  itemSelecionado.value = item;
  toggleModal();
}
</script>
<style scoped>
.output {
  text-wrap: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
