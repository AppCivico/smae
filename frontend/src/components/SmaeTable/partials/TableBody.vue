<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import type { Coluna, Linha, Linhas } from '../tipagem';
import { type DeleteButtonEvents, type DeleteButtonProps } from './DeleteButton.vue';
import { type EditButtonProps } from './EditButton.vue';
import TableRowContent from './TableRowContent.vue';

type ColunaComSlots = Coluna & {
  slots?: {
    coluna?: string
    celula?: string
  }
};

type Props =
  EditButtonProps
  & DeleteButtonProps
  & {
    dados: Linhas
    colunasFiltradas: ColunaComSlots[]
    hasActionButton: boolean
    temColunaDeAcoes: boolean
    listaSlotsUsados: {
      cabecalho: Record<string, true>
      celula: Record<string, true>
    }
    personalizarLinhas?: {
      parametro: string,
      alvo: unknown,
      classe: string
    }
    subLinhaAbertaPorPadrao?: boolean
    subLinhaSempreVisivel?: boolean
  };

type Emits = DeleteButtonEvents;

const props = withDefaults(defineProps<Props>(), {
  parametroDaRotaEditar: 'id',
  parametroNoObjetoParaEditar: 'id',
  parametroNoObjetoParaExcluir: 'descricao',
  subLinhaAbertaPorPadrao: false,
  subLinhaSempreVisivel: false,
});
const emit = defineEmits<Emits>();

const linhasExpandidas = ref<Record<number, boolean>>({});

watch(
  () => [props.subLinhaAbertaPorPadrao, props.dados.length] as const,
  ([abertaPorPadrao, tamanho]) => {
    if (!abertaPorPadrao || tamanho === 0) return;

    const indicesNovos = Array.from({ length: tamanho }, (_, i) => i)
      .filter((i) => linhasExpandidas.value[i] === undefined);

    if (indicesNovos.length) {
      linhasExpandidas.value = {
        ...linhasExpandidas.value,
        ...Object.fromEntries(indicesNovos.map((i) => [i, true])),
      };
    }
  },
  { immediate: true },
);

function toggleLinha(index: number): void {
  linhasExpandidas.value[index] = !linhasExpandidas.value[index];
}

const exibirToggle = computed(() => !props.subLinhaSempreVisivel);

function obterDestaqueDaLinha(linha: Linha): string | null {
  if (!props.personalizarLinhas) {
    return null;
  }

  if (linha[props.personalizarLinhas.parametro] === props.personalizarLinhas.alvo) {
    return props.personalizarLinhas.classe;
  }

  return null;
}
</script>

<template>
  <template v-if="$slots['sub-linha']">
    <tbody
      v-for="(linha, linhaIndex) in dados"
      :key="`tbody--${linhaIndex}`"
    >
      <tr
        :class="[
          'smae-table__linha',
          `smae-table__linha--${linhaIndex}`,
          obterDestaqueDaLinha(linha)
        ]"
      >
        <td
          v-if="exibirToggle"
          class="smae-table__toggle-cell"
        >
          <button
            type="button"
            class="smae-table__toggle-button"
            :aria-label="linhasExpandidas[linhaIndex] ? 'Recolher detalhes' : 'Expandir detalhes'"
            :aria-expanded="linhasExpandidas[linhaIndex]"
            @click="toggleLinha(linhaIndex)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              :style="{
                transform: linhasExpandidas[linhaIndex] ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </td>

        <TableRowContent
          :linha="linha"
          :linha-index="linhaIndex"
          :colunas-filtradas="colunasFiltradas"
          :has-action-button="hasActionButton"
          :tem-coluna-de-acoes="temColunaDeAcoes"
          :lista-slots-usados="listaSlotsUsados"
          :rota-editar="rotaEditar"
          :parametro-da-rota-editar="parametroDaRotaEditar"
          :parametro-no-objeto-para-editar="parametroNoObjetoParaEditar"
          :esconder-deletar="esconderDeletar"
          :parametro-no-objeto-para-excluir="parametroNoObjetoParaExcluir"
          :mensagem-exclusao="mensagemExclusao"
          @deletar="(ev: Linha) => emit('deletar', ev)"
        >
          <template
            v-for="(_, slotName) in $slots"
            :key="slotName"
            #[slotName]="slotProps"
          >
            <slot
              :name="slotName"
              v-bind="slotProps"
            />
          </template>
        </TableRowContent>
      </tr>

      <tr
        v-show="subLinhaSempreVisivel || linhasExpandidas[linhaIndex]"
        class="smae-table__sub-linha"
      >
        <td
          v-if="exibirToggle"
          class="smae-table__toggle-cell"
        />
        <slot
          name="sub-linha"
          :linha="linha"
          :linha-index="linhaIndex"
        />
      </tr>
    </tbody>

    <tbody v-if="dados.length === 0">
      <tr>
        <td :colspan="colunasFiltradas.length
          + (exibirToggle ? 1 : 0)
          + (temColunaDeAcoes ? 1 : 0)"
        >
          Sem dados para exibir
        </td>
      </tr>
    </tbody>
  </template>

  <tbody v-else>
    <slot
      name="corpo"
      :dados="dados"
    >
      <tr
        v-for="(linha, linhaIndex) in dados"
        :key="`linha--${linhaIndex}`"
        :class="[
          'smae-table__linha',
          `smae-table__linha--${linhaIndex}`,
          obterDestaqueDaLinha(linha)
        ]"
      >
        <TableRowContent
          :linha="linha"
          :linha-index="linhaIndex"
          :colunas-filtradas="colunasFiltradas"
          :has-action-button="hasActionButton"
          :tem-coluna-de-acoes="temColunaDeAcoes"
          :lista-slots-usados="listaSlotsUsados"
          :rota-editar="rotaEditar"
          :parametro-da-rota-editar="parametroDaRotaEditar"
          :parametro-no-objeto-para-editar="parametroNoObjetoParaEditar"
          :esconder-deletar="esconderDeletar"
          :parametro-no-objeto-para-excluir="parametroNoObjetoParaExcluir"
          :mensagem-exclusao="mensagemExclusao"
          @deletar="(ev: Linha) => emit('deletar', ev)"
        >
          <template
            v-for="(_, slotName) in $slots"
            :key="slotName"
            #[slotName]="slotProps"
          >
            <slot
              :name="slotName"
              v-bind="slotProps"
            />
          </template>
        </TableRowContent>
      </tr>

      <tr v-if="dados.length === 0">
        <td :colspan="colunasFiltradas.length + (temColunaDeAcoes ? 1 : 0)">
          Sem dados para exibir
        </td>
      </tr>
    </slot>
  </tbody>
</template>

<style scoped>
.smae-table__toggle-cell {
  width: 40px;
  padding: 8px;
  text-align: center;
  vertical-align: middle;
}

.smae-table__toggle-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}

.smae-table__toggle-button:hover {
  background-color: #f0f0f0;
  color: #333;
}

.smae-table__toggle-button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.smae-table__toggle-button:active {
  background-color: #e0e0e0;
}

.smae-table__sub-linha {
  background-color: #f9f9f9;
}
</style>
