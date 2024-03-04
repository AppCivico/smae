<script setup>
import { parlamentar as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import InputImageProfile from '@/components/InputImageProfile.vue';
import { ErrorMessage, Field, Form } from 'vee-validate';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  parlamentarId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(parlamentaresStore);
let avatar;
async function onSubmit(values) {
  values.avatar = avatar;

  console.log('submit values: ', values);
  //   console.log('vamos ver se o newvalues chega aqui: ', newValue);
  //   try {
  //     let r;
  //     const msg = props.parlamentarId
  //       ? 'Dados salvos com sucesso!'
  //       : 'Item adicionado com sucesso!';

//     if (props.parlamentarId) {
//       r = await parlamentaresStore.salvarItem(values, props.parlamentarId);
//     } else {
//       r = await parlamentaresStore.salvarItem(values);
//     }
//     if (r) {
//       alertStore.success(msg);
//       parlamentaresStore.$reset();
//       router.push({ name: 'parlamentaresListar' });
//     }
//   } catch (error) {
//     alertStore.error(error);
//   }
}

if (props.parlamentarId) {
  parlamentaresStore.buscarItem(props.parlamentarId);
}

</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Parlamentar' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting, }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
    @submit="onSubmit"
  >
    <div class="parlamentar-container">
      <div>
        <div class="flex g2 mb1">
          <div class="f1">
            <LabelFromYup
              name="nome"
              :schema="schema"
            />
            <Field
              name="nome"
              type="text"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="nome"
            />
          </div>
        </div>

        <div class="flex g2 mb1">
          <div class="f1">
            <LabelFromYup
              name="nome_popular"
              :schema="schema"
            />
            <Field
              name="nome_popular"
              type="text"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="nome_popular"
            />
          </div>
        </div>

        <div class="flex g2">
          <div class="f1">
            <LabelFromYup
              name="aniversario"
              :schema="schema"
            />
            <Field
              name="aniversario"
              type="text"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="aniversario"
            />
          </div>

          <div class="f1">
            <LabelFromYup
              name="atuacao"
              :schema="schema"
            />
            <Field
              name="atuacao"
              type="text"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="atuacao"
            />
          </div>
        </div>

        <div class="flex f1 mb1">
          <div class="f1">
            <LabelFromYup
              name="telefone"
              :schema="schema"
            />
            <Field
              name="telefone"
              type="text"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="aniversario"
            />
          </div>
        </div>

        <div class="flex g2 mb1">
          <div class="f1">
            <LabelFromYup
              name="biografia"
              :schema="schema"
            />
            <Field
              name="biografia"
              as="textarea"
              rows="5"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="biografia"
            />
          </div>
        </div>
      </div>
      <Field
        v-slot="{ value }"
        name="avatar"
      >
        <InputImageProfile
          :model-value="value"
          @update:model-value="(newValue) => { avatar = newValue }"
        />
      </Field>
    </div>
    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <span class="label tc300">Mandato</span>
      <hr class="mr2 f1">
    </div>

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

<style scoped lang="less">
.parlamentar-container {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 15px;

    & > :nth-child(2) {
        justify-self: end;
    }
}
</style>
