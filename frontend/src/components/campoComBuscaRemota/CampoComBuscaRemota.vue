<template>
  <label
    for="busca"
    class="label"
  >
    {{ props.label }}
    <span
      v-if="props.obrigatorio"
      class="tvermelho"
    >
      *
    </span>
  </label>
  <div class="flex g1">
    <output
      for="busca"
      class="inputtext light output"
      @click="toggleModal"
    >
      <slot
        v-if="itemSelecionado"
        name="valor-exibido"
        :item="itemSelecionado"
      >
        {{ valorExibido }}
      </slot>
    </output>
    <button
      v-if="itemSelecionado"
      type="button"
      class="like-a__text"
      arial-label="excluir"
      title="excluir"
      @click="limparSelecao"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_remove" /></svg>
    </button>

    <button
      id="busca"
      type="button"
      class="btn"
      @click="toggleModal"
    >
      {{ itemSelecionado ? 'Alterar' : props.textoDoBotão }}
    </button>
  </div>

  <SmallModal
    :active="estaAberto"
    @close="toggleModal"
  >
    <form @submit.prevent="onSubmit">
      <label
        for="palavra-chave"
        class="label"
      >
        {{ props.label }}
      </label>
      <div class="flex g1 mb2">
        <input
          id="palavra-chave"
          v-model="valorDaBusca"
          class="inputtext light"
          :name="chaveDeBusca"
          :minlength="props.minimoDeCaracteresParaBusca"
          required
          type="search"
          autocomplete="off"
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
      v-else-if="buscaRealizada"
      class="tablemain"
    >
      <thead v-if="linhas.length && $slots.tableHeader">
        <tr>
          <slot name="tableHeader" />
        </tr>
      </thead>
      <tbody>
        <template v-if="linhas.length">
          <tr
            v-for="item in linhas"
            :key="item.id"
          >
            <slot
              name="tableData"
              v-bind="{ item }"
            />
            <td>
              <button
                type="button"
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
            <td colspan="999">
              Nenhum resultado encontrado
            </td>
          </tr>
        </template>
      </tbody>
      <tfoot v-if="$slots.tableFooter">
        <slot name="tableFooter" />
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
  label: {
    type: String,
    required: true,
  },
  obrigatorio: {
    type: Boolean,
    default: false,
  },
  modalLabel: {
    type: String,
    default: 'Pesquisar',
  },
  minimoDeCaracteresParaBusca: {
    type: Number,
    default: 3,
  },
  textoDeInstruções: {
    type: String,
    default: 'Selecione uma opção',
  },
  textoDoBotão: {
    type: String,
    default: 'Selecionar',
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
const buscaRealizada = ref(false);

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
  buscaRealizada.value = true;
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

function limparSelecao() {
  itemSelecionado.value = null;
  emit('update:modelValue', null);
}

function limparBusca() {
  valorDaBusca.value = '';
  linhas.value = [];
  buscaRealizada.value = false;
}

function toggleModal() {
  estaAberto.value = !estaAberto.value;
  if (!estaAberto.value) {
    limparBusca();
  }
}

function selecionarItem(item) {
  itemSelecionado.value = item;
  toggleModal();
}

</script>
<style scoped>
.output {
  min-height: 2.8rem;
  text-wrap: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
