<script setup>
import { storeToRefs } from 'pinia';
import { Field } from 'vee-validate';
import { computed } from 'vue';

import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

import {
  distribuicaoFoiEscolhida,
  MENSAGEM_DE_DISTRIBUICAO_OBRIGATORIA,
} from './helpers/exigirDistribuicaoDeRecurso';

defineProps({
  distribuicoes: {
    type: Array,
    required: true,
  },
  name: {
    type: String,
    default: 'distribuicao_recurso_id',
  },
});

const { emFoco: transferencia } = storeToRefs(useTransferenciasVoluntariasStore());

// como "código - título" das metas no Programa de Metas
const rotuloDaTransferencia = computed(() => [
  transferencia.value?.identificador,
  transferencia.value?.objeto,
].filter(Boolean).join(' - ') || 'Esta transferência');

// vale para formulários sem schema; com schema, ver `exigirDistribuicaoDeRecurso`
function exigirEscolha(valor) {
  return distribuicaoFoiEscolhida(valor) || MENSAGEM_DE_DISTRIBUICAO_OBRIGATORIA;
}

function rotuloDaDistribuicao(distribuicao) {
  const nome = distribuicao.nome || distribuicao.objeto || `Distribuição ${distribuicao.id}`;

  return distribuicao.orgao_gestor?.sigla
    ? `${nome} - ${distribuicao.orgao_gestor.sigla}`
    : nome;
}
</script>
<template>
  <!-- mesma marcação do "Vincular dotação" dos demais módulos; `null` vincula
  a dotação à própria transferência -->
  <Field
    v-slot="{ value, handleChange, errorMessage }"
    :name="name"
    :rules="exigirEscolha"
  >
    <hr class="mt2 mb2">

    <div
      role="radiogroup"
      :aria-labelledby="`${name}--rotulo`"
      class="mb2"
    >
      <div
        :id="`${name}--rotulo`"
        class="label"
      >
        Vincular dotação<span class="tvermelho">*</span>
      </div>

      <div class="label tc300">
        Transferência
      </div>

      <label class="block mb1">
        <input
          :name="name"
          type="radio"
          class="inputcheckbox"
          :checked="value === null"
          data-test="opcao-transferencia"
          @change="handleChange(null)"
        >
        <span>{{ rotuloDaTransferencia }}</span>
      </label>

      <template v-if="distribuicoes.length">
        <div class="label tc300">
          Distribuições de recursos
        </div>

        <label
          v-for="distribuicao in distribuicoes"
          :key="distribuicao.id"
          class="block mb1"
        >
          <input
            :name="name"
            type="radio"
            class="inputcheckbox"
            :value="distribuicao.id"
            :checked="value === distribuicao.id"
            :data-test="`opcao-distribuicao-${distribuicao.id}`"
            @change="handleChange(distribuicao.id)"
          >
          <span>{{ rotuloDaDistribuicao(distribuicao) }}</span>
        </label>
      </template>

      <div
        v-if="errorMessage"
        class="error-msg"
      >
        {{ errorMessage }}
      </div>
    </div>
  </Field>
</template>
