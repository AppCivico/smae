<template>
  <div class="flex spacebetween center mb2">
    <h2>Escolher variáveis para {{ $props.indicador?.titulo }}</h2>
    <hr class="ml2 f1">
    <CheckClose
      :apenas-emitir="true"
      :formulario-sujo="!!combinacaoDeVariaveisSelecionadas.length"
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

  <form
    ref="formularioDeAssociacao"
    @submit.prevent="associar(false)"
  >
    <p class="mb1">
      <strong>
        {{ combinacaoDeVariaveisSelecionadas.length }}
      </strong>
      <template v-if="combinacaoDeVariaveisSelecionadas.length === 1">
        variável selecionada
      </template>
      <template v-else>
        variáveis selecionadas
      </template>
      de {{ lista.length }}.
    </p>

    <TabelaDeVariaveisGlobais
      :numero-de-colunas-extras="1"
      class="mb1"
    >
      <template #definicaoPrimeirasColunas>
        <col class="col--botão-de-ação">
      </template>
      <template #comecoLinhaCabecalho>
        <td />
      </template>

      <template #comecoLinhaVariavel="{ variavel }">
        <td
          class="nowrap"
        >
          <input
            v-if="!variavel?.possui_variaveis_filhas"
            v-model.number="variaveisSelecionadas"
            type="checkbox"
            title="selecionar"
            :value="variavel?.id"
            name="variavel_ids"
          >
          <span
            v-else-if="numeroDeSelecionadasPorMae[variavel?.id]"
            class="tc600 tipinfo right"
          >+{{ numeroDeSelecionadasPorMae[variavel.id] || 0 }}
            <div>filhas selecionadas</div>
          </span>
        </td>
      </template>

      <template #comecoLinhaVariavelFilha="{ agrupador, variavel, mae }">
        <td>
          <input
            type="checkbox"
            title="selecionar"
            :value="variavel?.id"
            :checked="variaveisFilhasSelecionadas[mae.id]?.[agrupador]?.includes(variavel.id)"
            :name="`variavel[${mae.id}].[${agrupador}].filha_ids`"
            @change="($e) => selecionarFilha(
              mae?.id,
              agrupador,
              variavel?.id,
              ($e.target as HTMLInputElement)?.checked
            )"
          >
        </td>
      </template>

      <template #comecoLinhaAgrupadora="{ agrupador, mae }">
        <td>
          <input
            type="checkbox"
            class="like-a__text"
            :indeterminate.prop="!!variaveisFilhasSelecionadas[mae.id]?.[agrupador]?.length
              && variaveisFilhasSelecionadas[mae.id]?.[agrupador]?.length !==
                filhasPorMaePorNivelDeRegiao[mae.id][agrupador].length"
            :checked="variaveisFilhasSelecionadas[mae.id]?.[agrupador]?.length ===
              filhasPorMaePorNivelDeRegiao[mae.id][agrupador].length"
            :aria-label="variaveisFilhasSelecionadas[mae.id]?.[agrupador]?.length ===
              filhasPorMaePorNivelDeRegiao[mae.id][agrupador].length
              ? `Desselecionar ${filhasPorMaePorNivelDeRegiao[mae.id][agrupador].length} itens`
              : `Selecionar ${filhasPorMaePorNivelDeRegiao[mae.id][agrupador].length}`"
            :title="variaveisFilhasSelecionadas[mae.id]?.[agrupador]?.length ===
              filhasPorMaePorNivelDeRegiao[mae.id][agrupador].length
              ? `Desselecionar ${filhasPorMaePorNivelDeRegiao[mae.id][agrupador].length} itens`
              : `Selecionar ${filhasPorMaePorNivelDeRegiao[mae.id][agrupador].length}`"
            @change="selecionarTodasAsFilhas(mae.id, agrupador)"
          >
        </td>
      </template>
    </TabelaDeVariaveisGlobais>

    <p class="mb1">
      <strong>
        {{ combinacaoDeVariaveisSelecionadas.length }}
      </strong>
      <template v-if="combinacaoDeVariaveisSelecionadas.length === 1">
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
        :aria-disabled="!combinacaoDeVariaveisSelecionadas.length || envioPendente"
        @click="associar(true)"
      >
        Associar e fechar
      </button>
      <button
        type="submit"
        class="btn big"
        :aria-disabled="!combinacaoDeVariaveisSelecionadas.length || envioPendente"
      >
        Associar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
<script setup lang="ts">
import type { Indicador } from '@/../../backend/src/indicador/entities/indicador.entity';
import FiltroDeDeVariaveis from '@/components/variaveis/FiltroDeDeVariaveis.vue';
import TabelaDeVariaveisGlobais from '@/components/variaveis/TabelaDeVariaveisGlobais.vue';
import EnvioParaObjeto from '@/helpers/EnvioParaObjeto.ts';
import requestS from '@/helpers/requestS.ts';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';
import { storeToRefs } from 'pinia';
import type { PropType } from 'vue';
import { computed, ref } from 'vue';
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
const variaveisFilhasSelecionadas = ref<{ [key: string]: { [key: string]: number[] } }>({});

const parametrosDaBuscaCorrente = ref<Record<string, unknown>>({});

const envioPendente = ref<boolean>(false);
const erro = ref<string | null>(null);

const numeroDeSelecionadasPorMae = computed(() => Object.keys(variaveisFilhasSelecionadas.value)
  .reduce((acc, mae: string) => {
    acc[mae] = Object.keys(variaveisFilhasSelecionadas.value[mae])
      .reduce((acc2, cur): number => acc2 + variaveisFilhasSelecionadas.value[mae][cur].length, 0);
    return acc;
  }, {} as { [key: string]: number }));

const combinacaoDeVariaveisSelecionadas = computed(() => {
  const combinacao: number[] = [...variaveisSelecionadas.value];

  Object.keys(variaveisFilhasSelecionadas.value).forEach((mae) => {
    Object.keys(variaveisFilhasSelecionadas.value[mae]).forEach((agrupador) => {
      combinacao.push(...variaveisFilhasSelecionadas.value[mae][agrupador]);
    });
  });

  return combinacao;
});

function selecionarTodasAsFilhas(
  maeId: number,
  agrupador: number | string,
) {
  const totalSelecionado = variaveisFilhasSelecionadas.value[maeId]?.[agrupador]?.length;
  const totalDisponivel = filhasPorMaePorNivelDeRegiao.value[maeId]?.[agrupador]?.length;

  if (totalSelecionado === totalDisponivel) {
    variaveisFilhasSelecionadas.value[maeId][agrupador] = [];
  } else {
    if (!variaveisFilhasSelecionadas.value[maeId]) {
      variaveisFilhasSelecionadas.value[maeId] = {};
    }
    if (!variaveisFilhasSelecionadas.value[maeId][agrupador]) {
      variaveisFilhasSelecionadas.value[maeId][agrupador] = [];
    }
    variaveisFilhasSelecionadas.value[maeId][agrupador] = filhasPorMaePorNivelDeRegiao
      .value[maeId][agrupador]
      .map((v) => v.id);
  }
}

function selecionarFilha(
  mae: number,
  agrupador: number | string,
  variavel: number,
  valor: boolean,
) {
  if (!valor) {
    variaveisFilhasSelecionadas.value[mae][agrupador] = variaveisFilhasSelecionadas
      .value[mae][agrupador]
      .filter((v) => v !== variavel);
  } else {
    if (!variaveisFilhasSelecionadas.value[mae]) {
      variaveisFilhasSelecionadas.value[mae] = {};
    }
    if (!variaveisFilhasSelecionadas.value[mae][agrupador]) {
      variaveisFilhasSelecionadas.value[mae][agrupador] = [];
    }

    variaveisFilhasSelecionadas.value[mae][agrupador].push(variavel);
  }
}

function buscarVariaveis(params: Record<string, unknown>) {
  variaveisGlobaisStore.buscarTudo({
    ...params,
    not_indicador_id: props.indicador?.id,
  }).then(() => {
    variaveisSelecionadas.value.splice(0);
    variaveisFilhasSelecionadas.value = {};
  });
}

function dispararBuscaDeVariaveis(evento: SubmitEvent) {
  const params = EnvioParaObjeto(evento, true);

  buscarVariaveis(params);

  parametrosDaBuscaCorrente.value = params;
}

async function associar(encerrar = false) {
  if (envioPendente.value) {
    return;
  }

  erro.value = null;
  envioPendente.value = true;

  requestS.patch(`${baseUrl}/plano-setorial-indicador/${props.indicador.id}/associar-variavel`, {
    variavel_ids: combinacaoDeVariaveisSelecionadas.value,
  }).then(() => {
    if (encerrar) {
      emit('close');
    }

    buscarVariaveis(parametrosDaBuscaCorrente.value);
  }).catch((err) => {
    erro.value = err.message;
  }).finally(() => {
    envioPendente.value = false;
  });
}

variaveisGlobaisStore.buscarTudo({
  ...valoresIniciais,
  not_indicador_id: props.indicador?.id,
});
</script>
