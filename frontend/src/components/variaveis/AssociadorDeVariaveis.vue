<template>
  <div class="flex spacebetween center mb2">
    <h2>Escolher variáveis para {{ $props.indicador?.titulo }}</h2>
    <hr class="ml2 f1">
    <CheckClose
      :apenas-emitir="true"
      :formulário-sujo="!!variaveisSelecionadas.length"
      @close="emit('close')"
    />
  </div>

  <FiltroDeDeVariaveis
    :aria-busy="chamadasPendentes.lista"
    :valores-iniciais="valoresIniciais"
    @submit="($v) => dispararBuscaDeVariaveis($v)"
  />

  <LoadingComponent v-if="chamadasPendentes.lista" />
  <p v-else>
    Exibindo <strong>{{ lista.length }}</strong> resultados de {{ paginacao.totalRegistros }}.
  </p>

  <div class="flex flexwrap g1 debug">
    <textarea
      class="f1"
      cols="30"
      rows="10"
    >
filhasPorMaePorNivelDeRegiao:{{ filhasPorMaePorNivelDeRegiao }}</textarea>
    <textarea
      class="f1"
      cols="30"
      rows="10"
    >
variaveisSelecionadas:{{ variaveisSelecionadas }}</textarea>
  </div>

  <form
    ref="formularioDeAssociacao"
    @submit.prevent="associar(false)"
  >
    <p class="mb1">
      <strong>
        {{ variaveisSelecionadas.length }}
      </strong>
      <template v-if="variaveisSelecionadas.length === 1">
        variável selecionada
      </template>
      <template v-else>
        variáveis selecionadas
      </template>
      de {{ lista.length }}.
    </p>

    <TabelaDeVariaveisGlobais
      :numero-de-colunas-extras="1"
    >
      <template #definicaoPrimeirasColunas>
        <col class="col--botão-de-ação">
      </template>
      <template #comecoLinhaCabecalho>
        <td />
      </template>

      <template #comecoLinhaVariavel="{ item }">
        <td>
          <input
            v-if="!item?.possui_variaveis_filhas"
            v-model.number="variaveisSelecionadas"
            type="checkbox"
            title="selecionar"
            :value="item?.id"
            name="variavel_ids"
          >
        </td>
      </template>

      <template #comecoLinhaAgrupadora="{ grupo }">
        <td>
          <button
            type="button"
            @click="selecionarGrupo(grupo)"
          >
            Selecionar {{ grupo.length }}
          </button>
        </td>
      </template>
    </TabelaDeVariaveisGlobais>

    <p class="mb1">
      <strong>
        {{ variaveisSelecionadas.length }}
      </strong>
      <template v-if="variaveisSelecionadas.length === 1">
        variável selecionada
      </template>
      <template v-else>
        variáveis selecionadas
      </template>
      de {{ lista.length }}.
    </p>

    <LoadingComponent
      v-if="envioPendente"
      class="mb1"
    />
    <ErrorComponent
      :erro="erro"
      class="mb1"
    />

    <div class="flex spacebetween g1 center mb2">
      <hr class="mr2 f1">
      <button
        type="button"
        class="btn outline bgnone tcprimary big"
        :aria-disabled="!variaveisSelecionadas.length || envioPendente"
        @click="associar(true)"
      >
        Associar e fechar
      </button>
      <button
        type="submit"
        class="btn big"
        :aria-disabled="!variaveisSelecionadas.length || envioPendente"
      >
        Associar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
<script setup lang="ts">
import type { Indicador } from '@/../../backend/src/indicador/entities/indicador.entity';
import type { VariavelGlobalItemDto } from '@/../../backend/src/variavel/entities/variavel.entity';
import FiltroDeDeVariaveis from '@/components/variaveis/FiltroDeDeVariaveis.vue';
import TabelaDeVariaveisGlobais from '@/components/variaveis/TabelaDeVariaveisGlobais.vue';
import EnvioParaObjeto from '@/helpers/EnvioParaObjeto.ts';
import requestS from '@/helpers/requestS.ts';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';
import { storeToRefs } from 'pinia';
import type { PropType } from 'vue';
import { ref } from 'vue';
import LoadingComponent from '../LoadingComponent.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  indicador: {
    type: Object as PropType<Indicador>,
    required: true,
  },
});

const emit = defineEmits(['close']);

const valoresIniciais = {
  ipp: 100,
  ordem_coluna: 'codigo',
  ordem_direcao: 'asc',
};

const variaveisGlobaisStore = useVariaveisGlobaisStore();
const {
  lista, chamadasPendentes, paginacao, filhasPorMaePorNivelDeRegiao,
} = storeToRefs(variaveisGlobaisStore);

const formularioDeAssociacao = ref<HTMLFormElement | null>(null);
const variaveisSelecionadas = ref<number[]>([]);
const envioPendente = ref<boolean>(false);
const erro = ref<string | null>(null);

function dispararBuscaDeVariaveis(evento: SubmitEvent) {
  const params = EnvioParaObjeto(evento, true);

  variaveisGlobaisStore.buscarTudo({
    ...params,
    not_indicador_id: props.indicador?.id,
  }).then(() => {
    variaveisSelecionadas.value.splice(0);
  });
}

async function associar(encerrar = false) {
  if (envioPendente.value) {
    return;
  }

  erro.value = null;
  envioPendente.value = true;

  requestS.patch(`${baseUrl}/plano-setorial-indicador/${props.indicador.id}/associar-variavel`, {
    variavel_ids: variaveisSelecionadas.value,
  }).then(() => {
    if (encerrar) {
      emit('close');
    }

    variaveisSelecionadas.value.splice(0);
  }).catch((err) => {
    erro.value = err.message;
  }).finally(() => {
    envioPendente.value = false;
  });
}

function selecionarGrupo(grupo: VariavelGlobalItemDto[]) {
  variaveisSelecionadas.value.push(...grupo.map((v) => v.id));
}

variaveisGlobaisStore.buscarTudo({
  ...valoresIniciais,
  not_indicador_id: props.indicador?.id,
});
</script>
