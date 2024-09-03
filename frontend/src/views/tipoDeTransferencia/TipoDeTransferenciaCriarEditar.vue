<script setup>
import categoriaDeTransferencia from '@/consts/categoriaDeTransferencia';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { tipoDeTransferencia as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ inheritAttrs: false });

const tipoDeTransferencia = useTipoDeTransferenciaStore();
const {
  chamadasPendentes,
  erro,
  lista,
   } = storeToRefs(tipoDeTransferencia);

const router = useRouter();
const route = useRoute();
const props = defineProps({
  tipoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const itemParaEdicao = computed(() => lista.value.find((x) => {
   return x.id === Number(route.params.tipoId);
 }) || {
   id: 0, nome: '', categoria: null, esfera: null,
});


async function onSubmit(values) {
  try {
    let r;
    const msg = props.tipoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.tipoId) {
      r = await tipoDeTransferencia.salvarItem(values, props.tipoId);
    } else {
      r = await tipoDeTransferencia.salvarItem(values);
    }
    if (r) {
      alertStore.success(msg);
      tipoDeTransferencia.$reset();
      router.push({ name: 'tipoDeTransferenciaListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.tipoId) {
  tipoDeTransferencia.buscarTudo(props.tipoId);
}

</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Tipo de Trasferência' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <Form v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdicao"
    @submit="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="nome" :schema="schema" />
        <Field name="nome" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="nome" />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="categoria" :schema="schema"/>
        <Field
          name="categoria" as="select" class="inputtext light mb1" :class="{ 'error': errors.categoria }">
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(categoriaDeTransferencia)"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.categoria }}
        </div>
      </div>
      <div class="f1">
        <LabelFromYup name="esfera" :schema="schema"/>
        <Field
          name="esfera" as="select" class="inputtext light mb1" :class="{ 'error': errors.esfera }">
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(esferasDeTransferencia)"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.esfera }}
        </div>
      </div>
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button class="btn big" :disabled="isSubmitting || Object.keys(errors)?.length" :title="Object.keys(errors)?.length
      ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
      : null">
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <span v-if="chamadasPendentes?.emFoco" class="spinner">Carregando</span>

  <div v-if="erro" class="error p1">
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
