<script setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import { relatórioDeParlamentares as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const alertStore = useAlertStore();
const partidosStore = usePartidosStore();
const relatoriosStore = useRelatoriosStore();
const parlamentaresStore = useParlamentaresStore();
const route = useRoute();
const router = useRouter();

const initialValues = {
  fonte: 'Parlamentares',
  parametros: {
    cargo: null,
    partido_id: null,
    eleicao_id: null,
  },
  eh_publico: null,
};

const { lista } = storeToRefs(partidosStore);

const {
  chamadasPendentes, erro, eleições, idsDasEleiçõesQueParlamentarConcorreu,
} = storeToRefs(parlamentaresStore);

const eleiçõesDisponíveisParaEdição = computed(() => eleições
  .value?.filter((x) => x.atual_para_mandatos) || []);
const eleiçãoEscolhida = ref(0);

const dadosDaEleiçãoEscolhida = computed(() => eleições
  .value?.find((y) => y.id === carga.eleicao_id));

async function onSubmit(values) {
  const carga = values;

  try {
    const msg = 'Relatório em processamento, acompanhe o status na listagem de relatórios';
    const r = await relatoriosStore.insert(carga);

    if (r === true) {
      alertStore.success(msg);
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

parlamentaresStore.buscarEleições();
partidosStore.buscarTudo();
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="false" />

  <p class="texto--explicativo">
    Relação de parlamentares contendo nome, partido, eleição, cargo, endereço,
    telefone e data de nascimento.
  </p>

  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="onSubmit"
  >
    <div class="flex flexwrap g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="partido_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.partido_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.partido_id'],
            loading: partidosStore.chamadasPendentes.lista
          }"
          :disabled="partidosStore.chamadasPendentes.lista"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in lista"
            :key="item.id"
            :value="item.id"
          >
            {{ item.sigla }} - {{ item.nome }}
          </option>
        </Field>

        <ErrorMessage name="parametros.partido_id" />
      </div>
      <div class="f1">
        <LabelFromYup
          name="cargo"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.cargo"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors['parametros.cargo'] }"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in cargosDeParlamentar"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>

        <ErrorMessage name="parametros.cargo" />
      </div>
      <div class="f1">
        <LabelFromYup
          name="eh_publico"
          :schema="schema"
        />
        <Field
          name="eh_publico"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors['eh_publico'] }"
        >
          <option
            value=""
            disabled
          >
            Selecionar
          </option>
          <option :value="true">
            Sim
          </option>
          <option :value="false">
            Não
          </option>
        </Field>

        <ErrorMessage name="eh_publico" />
      </div>
    </div>
    <div class="f1 mb2">
      <LabelFromYup
        name="eleicao_id"
        :schema="schema.fields.parametros"
      />
      <Field
        v-model.number="eleiçãoEscolhida"
        name="parametros.eleicao_id"
        as="select"
        class="inputtext light mb1"
        :class="{ error: errors.eleicao_id, loading: chamadasPendentes.emFoco }"
      >
        <option :value="null">
          Selecionar
        </option>
        <option
          v-for="pleito in eleiçõesDisponíveisParaEdição"
          :key="pleito.id"
          :value="pleito.id"
          :disabled="idsDasEleiçõesQueParlamentarConcorreu?.includes(pleito.id)"
        >
          {{ pleito.ano }} - {{ pleito.tipo || pleito.id }}
        </option>
      </Field>
      <ErrorMessage
        class="error-msg"
        name="parametros.eleicao_id"
      />
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Gerar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
