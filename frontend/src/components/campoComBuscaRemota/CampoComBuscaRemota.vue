<template>
  <div>
    <label
      v-if="label"
      for="busca"
      class="label"
    >
      <!-- eslint-disable-next-line vue/max-attributes-per-line -->
      {{ label }}&nbsp;<span v-if="obrigatorio" class="tvermelho">*</span>
    </label>

    <div class="flex g1">
      <output
        for="busca"
        class="inputtext light output"
        @click="toggleModal"
      >
        <slot
          v-if="itemSelecionado"
          name="ValorExibido"
          :item="itemSelecionado"
        >
          {{ valorExibido }}
        </slot>
      </output>

      <button
        v-if="podeRemover && itemSelecionado"
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
        class="btn bgnone outline tcprimary"
        @click="toggleModal"
      >
        {{ itemSelecionado ? 'Selecionar' : textoDoBotao }}
      </button>
    </div>

    <SmallModal
      :active="estaAberto"
      :has-close-button="true"
      @close="toggleModal"
    >
      <form @submit.prevent="onSubmit">
        <label
          for="palavra-chave"
          class="label"
        >
          {{ textoDeInstrucoes }}
        </label>
        <div class="flex g1 mb2">
          <input
            id="palavra-chave"
            v-model="valorDaBusca"
            v-focus
            class="inputtext light"
            :name="chaveDeBusca"
            :minlength="minimoDeCaracteresParaBusca"
            required
            type="search"
            autocomplete="off"
          >
          <button
            class="btn"
            type="submit"
            :aria-disabled="carregando"
          >
            Buscar
          </button>
        </div>
      </form>

      <LoadingComponent v-if="carregando" />

      <table
        v-else-if="buscaRealizada"
        class="tablemain"
      >
        <thead v-if="linhas.length && $slots.TableHeader">
          <tr>
            <slot name="TableHeader" />
            <th />
          </tr>
        </thead>
        <tbody>
          <template v-if="linhas.length">
            <tr
              v-for="item in linhas"
              :key="item.id"
            >
              <slot
                name="TableData"
                v-bind="{ item }"
              >
                <td>
                  {{ item[chaveDeExibicao] }}
                </td>
              </slot>

              <td>
                <div class="flex justifyright">
                  <button
                    type="button"
                    class="btn bgnone outline tcprimary"
                    @click="selecionarItem(item)"
                  >
                    Selecionar
                  </button>
                </div>
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
        <tfoot v-if="$slots.TableFooter">
          <slot name="TableFooter" />
        </tfoot>
      </table>
    </SmallModal>
  </div>
</template>

<script setup>
import {
  ref,
  defineProps,
  computed,
  watch,
  defineEmits,
  onMounted,
} from 'vue';
import SmallModal from '@/components/SmallModal.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import requestS from '@/helpers/requestS';

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const emit = defineEmits([
  'update:modelValue',
  'itemSelecionado',
]);

const props = defineProps({
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
  valorInicial: {
    type: Object,
    default: null,
  },
  label: {
    type: String,
    default: null,
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
    default: 2,
  },
  textoDeInstrucoes: {
    type: String,
    default: 'Pesquisar por',
  },
  textoDoBotao: {
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
  chaveDeExibicao: {
    type: String,
    default: () => 'id',
  },
  parametrosExtras: {
    type: Object,
    default: () => ({}),
  },
  podeRemover: {
    type: Boolean,
    default: true,
  },
});

const estaAberto = ref(false);
const linhas = ref([]);
const valorDaBusca = ref('');
const itemSelecionado = ref(null);
const carregando = ref(false);
const buscaRealizada = ref(false);

const valorExibido = computed(() => {
  if (itemSelecionado.value) {
    return itemSelecionado.value[props.chaveDeExibicao];
  }

  return valorDaBusca.value;
});

async function onSubmit() {
  if (carregando.value) return;

  carregando.value = true;
  buscaRealizada.value = true;
  try {
    const parametros = {
      ...props.parametrosExtras,
      [props.chaveDeBusca]: valorDaBusca.value,
    };

    const retorno = await requestS.get(`${baseUrl}/${props.urlRequisicao}`, parametros);
    linhas.value = retorno[props.chaveDeRetorno] || [];
  } catch (error) {
    console.error('Erro na requisição:', error);
    linhas.value = [];
  } finally {
    carregando.value = false;
  }
}

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

  emit('itemSelecionado', item);

  toggleModal();
}

watch(itemSelecionado, (novoValor) => {
  emit('update:modelValue', novoValor?.[props.chaveDeValor]);
});

onMounted(() => {
  itemSelecionado.value = { ...props.valorInicial };
});
</script>

<style scoped>
.output {
  min-height: 2.8rem;
  text-wrap: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
