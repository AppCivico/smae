<template>
  <section class="mb2">
    <div class="flex g2 spacebetween center mb2">
      <TítuloDePágina />

      <hr>

      <router-link
        class="btn round"
        :to="{ name: 'classificacao'}"
      >
        <svg
          width="12"
          height="12"
        ><use xlink:href="#i_x" /></svg>
      </router-link>
    </div>

    <form
      class="flex column g1"
      @submit="onSubmit"
    >
      <div class="flex">
        <div class="f1">
          <LabelFromYup
            name="nome"
            :schema="schema"
          />

          <Field
            name="nome"
            class="inputtext light"
          />

          <ErrorMessage
            class="error-msg mb1"
            name="nome"
          />
        </div>
      </div>

      <div class="flex g2">
        <div class="f1">
          <LabelFromYup
            :schema="schema"
            name="esfera"
          />

          <Field
            name="esfera"
            class="inputtext light"
            as="select"
          >
            <option value="">
              -
            </option>

            <option
              v-for="item in esferasDeTransferencia"
              :key="item.valor"
              :value="item.valor"
            >
              {{ item.nome }}
            </option>
          </Field>

          <ErrorMessage
            class="error-msg mb1"
            name="esfera"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            :schema="schema"
            name="transferencia_tipo_id"
          />

          <Field
            class="inputtext light"
            name="transferencia_tipo_id"
            as="select"
            :disabled="tiposPorEsfera.length === 0"
          >
            <option value="">
              -
            </option>

            <option
              v-for="tipo in tiposPorEsfera"
              :key="`classificacao-tipo--${tipo.id}`"
              :value="tipo.id"
            >
              {{ tipo.nome }}
            </option>
          </Field>

          <ErrorMessage
            class="error-msg mb1"
            name="transferencia_tipo_id"
          />
        </div>
      </div>

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>
  </section>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import {
  computed, onMounted, watch,
} from 'vue';

import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { classificacaoCriarEditarSchema as schema } from '@/consts/formSchemas';

import { useClassificacaoStore } from '@/stores/classificacao.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';

const { params } = useRoute();
const $router = useRouter();

const classificacaoStore = useClassificacaoStore();
const tipoDeTransferenciaStore = useTipoDeTransferenciaStore();

const {
  isSubmitting, handleSubmit, values, setFieldValue, setValues,
} = useForm({
  validationSchema: schema,
});

const estaEditando = computed<boolean>(() => !!params.classificacaoId);

const tiposPorEsfera = computed(() => (
  tipoDeTransferenciaStore.lista.filter((item) => item.esfera === values.esfera) || []
));

watch(() => values.esfera, (to, from) => {
  if (from !== undefined) {
    setFieldValue('transferencia_tipo_id', null);
  }
});

onMounted(async () => {
  tipoDeTransferenciaStore.buscarTudo();

  if (estaEditando.value) {
    const classificacao = await classificacaoStore.buscarItem(params.classificacaoId);

    setValues({
      nome: classificacao.nome,
      esfera: classificacao.transferencia_tipo.esfera,
      transferencia_tipo_id: classificacao.transferencia_tipo.id.toString(),
    });
  }
});

function voltarLista() {
  $router.push({
    name: 'classificacao',
  });
}

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const dados = {
    nome: valoresControlados.nome,
    transferencia_tipo_id: Number(valoresControlados.transferencia_tipo_id),
  };

  if (estaEditando.value) {
    await classificacaoStore.atualizarItem(params.classificacaoId, dados);
  } else {
    await classificacaoStore.salvarItem(dados);
  }

  voltarLista();
});
</script>
