<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm,
} from 'vee-validate';
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { tipoEncerramento as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTipoEncerramentoStore } from '@/stores/tipoEncerramento.store';

const { sistemaEscolhido } = useAuthStore();
const tipoEncerramentoStore = useTipoEncerramentoStore(sistemaEscolhido);
const { emFoco } = storeToRefs(tipoEncerramentoStore);

const route = useRoute();
const router = useRouter();

type Props = {
  tipoEncerramentoId?: number
};
const props = defineProps<Props>();

const alertStore = useAlertStore();

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async (values) => {
  try {
    const msg = route.params.tipoEncerramentoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (route.params.tipoEncerramentoId) {
      await tipoEncerramentoStore.salvarItem(values, Number(route.params.tipoEncerramentoId));
    } else {
      await tipoEncerramentoStore.salvarItem(values);
    }

    alertStore.success(msg);
    tipoEncerramentoStore.$reset();
    router.push({ name: route.meta.rotaDeEscape as string });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Erro ao tentar salvar item', e);
  }
});

watch(emFoco, (novo) => {
  if (novo) {
    resetForm({ values: novo });
  }
}, { immediate: true });

onMounted(() => {
  if (props.tipoEncerramentoId) {
    tipoEncerramentoStore.buscarItem(props.tipoEncerramentoId);
  }
});
</script>

<template>
  <CabecalhoDePagina />

  <form
    class="flex column g1"
    @submit="onSubmit"
  >
    <div class="flex g2">
      <div class="f1">
        <SmaeLabel
          name="descricao"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="descricao"
        >
          <SmaeText
            :model-value="value"
            :name="field.name"
            as="textarea"
            rows="5"
            class="inputtext light"
            maxlength="500"
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          class="error-msg"
          name="descricao"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1">
        <SmaeLabel
          class="mb0"
          name="habilitar_info_adicional"
          :schema="schema"
        >
          <template #prepend>
            <Field
              id="habilitar_info_adicional"
              name="habilitar_info_adicional"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
              class="mr05 inputcheckbox"
            />
          </template>
        </SmaeLabel>

        <ErrorMessage
          class="error-msg"
          name="habilitar_info_adicional"
        />
      </div>
    </div>

    <SmaeFieldsetSubmit />
  </form>
</template>
