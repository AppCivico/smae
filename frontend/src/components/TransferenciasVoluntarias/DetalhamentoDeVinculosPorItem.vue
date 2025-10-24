<script setup lang="ts">
import dinheiro from '@/helpers/dinheiro';
import type { Filtros } from '@/stores/transferenciasVinculos.store';
import { useTransferenciasVinculosStore } from '@/stores/transferenciasVinculos.store';
import { storeToRefs } from 'pinia';
import SmaeTable from '../SmaeTable/SmaeTable.vue';

const transferenciasVinculosStore = useTransferenciasVinculosStore();

const {
  lista,
  chamadasPendentes,
  erros,
} = storeToRefs(transferenciasVinculosStore);

const props = defineProps({
  dados: {
    type: Object,
    default: () => null,
  },
});

function carregarVinculos() {
  if (!props.dados) {
    return;
  }

  lista.value.splice(0);

  const filtros:Filtros = {};

  switch (true) {
    case props.dados.modulo === 'obras':
    case props.dados.modulo === 'projetos':
      filtros.projeto_id = props.dados.id;
      break;

    case !!props.dados.atividade_info?.id:
      filtros.atividade_id = props.dados.atividade_info.id;
      break;

    case !!props.dados.iniciativa_info?.id:
      filtros.iniciativa_id = props.dados.iniciativa_info.id;
      break;

    case !!props.dados.meta_info?.id:
      filtros.meta_id = props.dados.meta_info.id;
      break;

    default:
      break;
  }

  transferenciasVinculosStore.buscarVinculos(filtros);
}

carregarVinculos();
</script>
<template>
  <div
    v-if="dados.detalhes"
    class="mb2"
  >
    <dl
      class="celula__lista mb1 flex flexwrap g1"
    >
      <div
        v-for="(valor, chave) in dados.detalhes"
        :key="chave"
        class="celula__item f1"
      >
        <dt class="t14 w700 mb05 tamarelo">
          {{ chave }}
        </dt>
        <dd>
          {{ valor || '-' }}
        </dd>
      </div>
    </dl>
  </div>

  <ErrorComponent
    v-if="erros.lista"
    :erro="erros.lista"
  />

  <LoadingComponent v-if="chamadasPendentes.lista">
    Consultando vínculos...
  </LoadingComponent>

  <SmaeTable
    v-else-if="lista.length"
    titulo="Distribuições vinculadas"
    :colunas="[
      {
        chave: 'distribuicao_recurso.transferencia.nome',
        label: 'Identificador'
      },
      {
        chave: 'distribuicao_recurso.orgao.sigla',
        label: 'Órgão',
      },
      {
        chave: 'distribuicao_recurso.nome',
        label: 'Distribuição'
      },
      {
        chave: 'distribuicao_recurso',
        label: 'Valor',
        atributosDaColuna: {
          class: 'col--minimum'
        },
        atributosDoCabecalhoDeColuna: {
          class: 'cell--number'
        },
        atributosDaCelula: {
          class: 'cell--number'
        }
      },
      {
        chave: 'observacao',
        label: 'Observação'
      },
    ]"
    :dados="lista as unknown as Array<Record<string, unknown>>"
  >
    <template #celula:distribuicao_recurso="{ celula }">
      {{ (celula?.valor ?? null) !== null ? 'R$ ' + dinheiro(celula.valor) : '-' }}
    </template>
  </SmaeTable>
</template>
