<script setup>
import tiposDePlanos from '@/consts/tiposDePlanos';
import simplificarOrigem from '@/helpers/simplificadorDeOrigem';
import truncate from '@/helpers/texto/truncate';
import { usePlanosSimplificadosStore } from '@/stores/planosMetasSimplificados.store.ts';
import { storeToRefs } from 'pinia';
import { useField } from 'vee-validate';
import { ref, watch, watchEffect } from 'vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  etiquetaBotaoAdicao: {
    type: String,
    default: 'Adicionar',
  },
  titulo: {
    type: String,
    default: 'Relacionamentos',
  },
  valoresIniciais: {
    type: Array,
    default: () => [],
  },
  apenasPdms: {
    type: Boolean,
    default: true,
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    required: true,
    default: '',
  },
});

const planosSimplificadosStore = usePlanosSimplificadosStore();
const {
  arvoreDeMetas,
  planosPorId,
  planosSimplificados,
  planosAgrupadosPorTipo,
  chamadasPendentes,
  erros,
} = storeToRefs(planosSimplificadosStore);

const campoPronto = ref(false);

const valores = ref([]);
const promessas = [];

const { handleChange, resetField } = useField(props.name, undefined, {
  initialValue: valores.value,
});

function buscarArvoreDeMetas(valorOuEvento) {
  const idDaMeta = valorOuEvento.target?.value || valorOuEvento;

  if (idDaMeta && !arvoreDeMetas.value?.[idDaMeta]) {
    planosSimplificadosStore.buscarArvoreDeMetas({ meta_ids: idDaMeta });
  }
}

function redefinirValores(indice, propriedadeMae) {
  switch (propriedadeMae) {
    case 'pdm':
      delete valores.value[indice].meta_id;
    // fall through
    case 'meta':
      delete valores.value[indice].iniciativa_id;
    // fall through
    case 'iniciativa':
    default:
      delete valores.value[indice].atividade_id;
  }
}

function removerLinha(indice) {
  valores.value.splice(indice, 1);
}

function adicionarLinha() {
  valores.value.push({
    origem_tipo: 'PdmSistema',
  });
}

watchEffect(async () => {
  await Promise.allSettled(promessas);

  if (Array.isArray(props.valoresIniciais)) {
    // OBSOLETO: Não vale a pena manipular aqui dentro porque pode "sujar" o
    // formulário.
    // Melhor só atribuir.
    valores.value = props.valoresIniciais.map((origem) => simplificarOrigem(origem));
  }

  campoPronto.value = false;
  promessas.splice(0);

  if (!planosSimplificados.value.length && !chamadasPendentes.value.planosSimplificados) {
    promessas.push(planosSimplificadosStore.buscarPlanos({ apenas_pdm: props.apenasPdms }));
  }

  if (valores.value.length) {
    const metasBuscar = [];
    valores.value.forEach((valor) => {
      if (valor.meta_id && !arvoreDeMetas.value[valor.meta_id]) {
        metasBuscar.push(valor.meta_id);
      }
    });

    if (metasBuscar.length) {
      promessas.push(planosSimplificadosStore.buscarArvoreDeMetas({ meta_ids: metasBuscar }));
    }
  }

  Promise.all(promessas)
    .then(() => {
      campoPronto.value = true;
    })
    .catch((erro) => {
      console.error('Erro ao montar CampoDePlanosMetasRelacionados', erro);
      throw erro;
    });

  resetField({
    value: valores.value,
  });
});

watch(valores, (novoValor) => {
  handleChange(novoValor);
  emit('update:modelValue', novoValor);
}, { deep: true });
</script>
<template>
  <fieldset
    class="campo-de-equipes"
    :aria-busy="!campoPronto"
  >
    <legend class="mb1">
      {{ $props.titulo }}
    </legend>

    <div
      v-for="(item, idx) in valores"
      :key="item.id"
      class="flex g2 mb1"
    >
      <input
        v-model="valores[idx].id"
        :name="`${$props.name}[${idx}].id`"
        type="hidden"
      >
      <input
        :name="`${$props.name}[${idx}].origem_tipo`"
        value="PdmSistema"
        type="hidden"
      >

      <div class="flex f1 flexwrap g2">
        <div class="f1 fb10em">
          <label
            :for="`${$props.name}__pdm--${idx}`"
            class="label"
          >
            Programa de metas/Plano Setorial&nbsp;<span class="tvermelho">*</span>
          </label>
          <select
            :id="`${$props.name}[${idx}].pdm_escolhido`"
            v-model="valores[idx].pdm_escolhido"
            :name="`${$props.name}[${idx}].pdm_escolhido`"
            class="inputtext light mb1"
            :aria-busy="chamadasPendentes?.planosSimplificados"
            :disabled="!planosSimplificados?.length"
            @change="redefinirValores(idx, 'pdm')"
          >
            <option
              value=""
              :selected="!valores?.[idx]?.pdm_escolhido"
            >
              Selecionar
            </option>
            <optgroup
              v-for="(grupo, chave) in planosAgrupadosPorTipo"
              :key="chave"
              :label="tiposDePlanos[chave]?.nome || chave"
            >
              <option
                v-for="plano in grupo"
                :key="plano.id"
                :value="plano.id"
                :disabled="!planosPorId[plano.id]?.metas?.length"
              >
                {{ plano.nome }}
                <template v-if="!planosPorId[plano.id]?.metas?.length">
                  (sem metas disponíveis)
                </template>
              </option>
            </optgroup>
          </select>
        </div>
        <div class="f1 fb10em">
          <label
            class="label"
            :for="`${$props.name}[${idx}].meta_id`"
          >Meta</label>
          <select
            v-if="!planosPorId[valores[idx]?.pdm_escolhido]?.metas?.length"
            :id="`${$props.name}[${idx}].meta_id`"
            :name="`${$props.name}[${idx}].meta_id`"
            class="inputtext light mb1"
            disabled
          >
            <option value="">
              indisponível
            </option>
          </select>
          <select
            v-else
            :id="`${$props.name}[${idx}].meta_id`"
            v-model="valores[idx].meta_id"
            :name="`${$props.name}[${idx}].meta_id`"
            class="inputtext light mb1"
            :disabled="!planosPorId[valores[idx]?.pdm_escolhido]?.metas?.length"
            @change="($e) => {
              redefinirValores(idx, 'meta');
              buscarArvoreDeMetas($e.target.value);
            }"
          >
            <option
              value=""
              :selected="!valores?.[idx]?.meta_id"
            >
              Selecionar
            </option>
            <option
              v-for="pdm in planosPorId[valores[idx]?.pdm_escolhido]?.metas"
              :key="pdm.id"
              :value="pdm.id"
              :title="pdm.titulo"
            >
              {{ pdm.codigo }} - {{ truncate(pdm.titulo, 36) }}
            </option>
          </select>
        </div>
        <div class="f1 fb10em">
          <label
            class="label"
            :for="`${$props.name}[${idx}].iniciativa_id`"
          >{{ planosPorId[valores[idx]?.pdm_escolhido]?.rotulo_iniciativa || 'Iniciativa' }}</label>
          <select
            v-if="!Object.keys(
              arvoreDeMetas?.[valores[idx].meta_id]?.iniciativas || {}
            )?.length"
            :id="`${$props.name}[${idx}].iniciativa_id`"
            class="inputtext light mb1"
            disabled
            :name="`${$props.name}[${idx}].iniciativa_id`"
          >
            <option value="">
              indisponível
            </option>
          </select>
          <select
            v-else
            :id="`${$props.name}[${idx}].iniciativa_id`"
            v-model="valores[idx].iniciativa_id"
            :name="`${$props.name}[${idx}].iniciativa_id`"
            class="inputtext light mb1"
            :aria-busy="chamadasPendentes?.arvoreDeMetas"
            :disabled="!Object.keys(
              arvoreDeMetas?.[valores[idx].meta_id]?.iniciativas || {}
            )?.length"
            @change="redefinirValores(idx, 'iniciativa')"
          >
            <option
              value=""
            >
              Selecionar
            </option>
            <option
              v-for="iniciativa in arvoreDeMetas?.[valores[idx].meta_id]?.iniciativas"
              :key="iniciativa.id"
              :value="iniciativa.id"
              :title="iniciativa.titulo"
            >
              {{ iniciativa.codigo }} - {{ truncate(iniciativa.titulo, 36) }}
            </option>
          </select>
        </div>
        <div class="f1 fb10em">
          <label
            class="label"
            :for="`${$props.name}[${idx}].atividade_id`"
          >{{ planosPorId[valores[idx]?.pdm_escolhido]?.rotulo_atividade || 'Atividade' }}</label>
          <select
            v-if="!Object.keys(arvoreDeMetas?.[valores[idx].meta_id]
              ?.iniciativas?.[valores[idx].iniciativa_id]?.atividades
              || {})?.length"
            :id="`${$props.name}[${idx}].atividade_id`"
            class="inputtext light mb1"
            :name="`${$props.name}[${idx}].atividade_id`"
            disabled
          >
            <option value="">
              indisponível
            </option>
          </select>
          <select
            v-else
            :id="`${$props.name}[${idx}].atividade_id`"
            v-model="valores[idx].atividade_id"
            :name="`${$props.name}[${idx}].atividade_id`"
            class="inputtext light mb1"
            :aria-busy="chamadasPendentes?.arvoreDeMetas"
            :disabled="!Object.keys(arvoreDeMetas?.[valores[idx].meta_id]
              ?.iniciativas?.[valores[idx].iniciativa_id]?.atividades
              || {})?.length"
          >
            <option
              value=""
            >
              Selecionar
            </option>
            <option
              v-for="atividade in arvoreDeMetas?.[valores?.[idx].meta_id]
                ?.iniciativas?.[valores?.[idx].iniciativa_id]?.atividades"
              :key="atividade.id"
              :value="atividade.id"
              :title="atividade.titulo"
            >
              {{ atividade.codigo }} - {{ truncate(atividade.titulo, 36) }}
            </option>
          </select>
        </div>
      </div>

      <button
        class="like-a__text addlink"
        type="button"
        arial-label="excluir"
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
      :disabled="!planosSimplificados.length || !Array.isArray(valores)"
      @click="adicionarLinha"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg>
      {{ $props.etiquetaBotaoAdicao }}
    </button>

    <ErrorComponent
      v-for="erro in erros"
      :key="erro"
      :erro="erro"
    />

    <slot name="rodape" />

    <div
      v-scrollLockDebug
      class="flex flexwrap g2 mb2"
    >
      <textarea
        readonly
        rows="15"
        class="f1"
      >$props.modelValue:{{ $props.modelValue }}</textarea>
      <textarea
        readonly
        rows="15"
        class="f1"
      >valores:{{ valores }}</textarea>
    </div>
  </fieldset>
</template>
