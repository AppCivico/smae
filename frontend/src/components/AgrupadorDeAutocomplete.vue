<template>
  <div class="agrupador-de-autocomplete">
    <legend
      v-if="titulo"
      class="legend mb1"
    >
      {{ titulo }}
    </legend>

    <div
      v-for="(linhaSelecao, linhaSelecaoIndex) in selecoes"
      :key="`agrupador-linha--${linhaSelecaoIndex}`"
      class="flex flexwrap g2 mb1"
    >
      <div class="f1 fb10em">
        <label
          class="label"
          :for="`${namePrincipal}[${linhaSelecaoIndex}].campo-agrupador`"
        >{{ labelCampoAgrupador }}</label>

        <select
          :id="`${namePrincipal}[${linhaSelecaoIndex}].campo-agrupador`"
          v-model="linhaSelecao.agrupadorId"
          :name="`${namePrincipal}[${linhaSelecaoIndex}].campo-agrupador`"
          class="inputtext light mb1"
          :disabled="mapaOpcoes[linhaSelecaoIndex].listaDeAgrupadores.length === 0"
          @change="limparCampoItem(linhaSelecaoIndex)"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="agrupadorItem in mapaOpcoes[linhaSelecaoIndex].listaDeAgrupadores"
            :key="`agrupador-item--${agrupadorItem.id}`"
            :value="agrupadorItem.id"
          >
            {{ agrupadorItem.nome }}
          </option>
        </select>
      </div>

      <div class="f1 fb10em">
        <label
          class="label"
          :for="`${namePrincipal}[${linhaSelecaoIndex}].campo-item`"
        >{{ labelCampoItem }}</label>

        <AutocompleteField2
          :id="`${namePrincipal}[${linhaSelecaoIndex}].campo-item`"
          :controlador="{
            busca: '',
            participantes: linhaSelecao.itemId
          }"
          :grupo="mapaOpcoes[linhaSelecaoIndex].listaDeItems"
          label="nome"
          @change="selecionarItem(linhaSelecaoIndex, $event)"
        />
      </div>

      <button
        class="like-a__text addlink"
        arial-label="excluir"
        title="excluir"
        type="button"
        @click="removerItem(linhaSelecaoIndex)"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_remove" /></svg>
      </button>
    </div>

    <div class="agrupador-de-autocomplete__adicionar">
      <button
        class="like-a__text addlink"
        type="button"
        @click="adicionarItem"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg>
        Adicionar {{ titulo }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep } from 'lodash';
import { watch, computed, ref } from 'vue';
import AutocompleteField2 from './AutocompleteField2.vue';

type Items = (string | number)[];

type Agrupador = {
  agrupadorId?: number | string
  itemId?: Items
};

export type ValoresSelecionados = Agrupador[];

type Opcao = {
  id: number | string;
  [key: string]: any
};
type Opcoes = Opcao[];

type MapaOpcoes = {
  listaDeAgrupadores: Opcoes
  listaDeItems: Opcoes
};

type Props = {
  titulo?: string;
  valoresIniciais: ValoresSelecionados,
  modelValue?: number[],
  listaDeAgrupadores: Opcoes,
  listaDeItems: Opcoes,
  namePrincipal?: string
  labelCampoAgrupador: string,
  labelCampoItem: string,
  logicaMapeamentoDeOpcoes: (
    selecionados: ValoresSelecionados,
    listaDeAgrupadores: Opcoes,
    listaDeItems: Opcoes
  ) => MapaOpcoes[]
};

type Emits = {
  (event: 'update:modelValue', items: Items): void
};

const props = withDefaults(defineProps<Props>(), {
  titulo: undefined,
  namePrincipal: undefined,
  modelValue: () => [],
});
const emit = defineEmits<Emits>();

const selecoes = ref<ValoresSelecionados>([]);

const mapaOpcoes = computed<MapaOpcoes[]>(() => props.logicaMapeamentoDeOpcoes(
  selecoes.value,
  props.listaDeAgrupadores,
  props.listaDeItems,
));

function adicionarItem() {
  selecoes.value.push({ agrupadorId: undefined, itemId: [] });
}

function removerItem(itemIndex: number) {
  selecoes.value.splice(itemIndex, 1);
}

function selecionarItem(itemIndex: number, itemsSelecionados: Items) {
  const linha = selecoes.value[itemIndex];
  if (!linha) {
    throw new Error(`Linha não encontrada para index "${itemIndex}"`);
  }

  linha.itemId = itemsSelecionados;
}

function limparCampoItem(itemIndex: number) {
  const linha = selecoes.value[itemIndex];
  if (!linha) {
    throw new Error(`Linha não encontrada para index "${itemIndex}"`);
  }

  if (linha.itemId) {
    linha.itemId.splice(0);
  }
}

watch(() => props.valoresIniciais, (v) => {
  selecoes.value = cloneDeep(v);
}, { immediate: true, deep: true });

watch(() => selecoes.value, () => {
  const itemsMapeados = selecoes.value.reduce<Items>((amount, item, i) => {
    const items = item.itemId?.filter((v) => !!v) || [];

    // eslint-disable-next-line no-param-reassign
    amount = [...new Set([...amount, ...items])];

    return amount;
  }, [] as Items);

  emit('update:modelValue', itemsMapeados);
}, { deep: true });
</script>
