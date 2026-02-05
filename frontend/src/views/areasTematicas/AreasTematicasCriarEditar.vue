<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import CheckClose from '@/components/CheckClose.vue';
import { areaTematica as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAreasTematicasStore } from '@/stores/areasTematicas.store';

const alertStore = useAlertStore();
const areasTematicasStore = useAreasTematicasStore();
const router = useRouter();

const { chamadasPendentes, emFoco } = storeToRefs(areasTematicasStore);

const props = defineProps({
  areaTematicaId: {
    type: Number,
    default: 0,
  },
});

const valoresIniciais = computed(() => {
  if (props.areaTematicaId && emFoco.value?.id) {
    return {
      nome: emFoco.value.nome || '',
      ativo: emFoco.value.ativo ?? true,
      acoes: emFoco.value.acoes?.length > 0
        ? emFoco.value.acoes
        : [{ nome: '', ativo: true }],
    };
  }

  return {
    nome: '',
    ativo: true,
    acoes: [{ nome: '', ativo: true }],
  };
});

const {
  errors,
  handleSubmit,
  isSubmitting,
  resetForm,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit(async (carga) => {
  try {
    const msg = props.areaTematicaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const r = await areasTematicasStore.salvarItem(
      carga,
      props.areaTematicaId,
    );

    if (r) {
      alertStore.success(msg);
      areasTematicasStore.$reset();
      router.push({ name: 'areasTematicas.listar' });
    } else {
      alertStore.error('Não foi possível salvar os dados. Tente novamente.');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function aoCancelar() {
  alertStore.$reset();
  areasTematicasStore.$reset();
  router.push({ name: 'areasTematicas.listar' });
}

onMounted(() => {
  if (props.areaTematicaId) {
    areasTematicasStore.buscarItem(props.areaTematicaId);
  }
});

watch(valoresIniciais, (novosValores) => {
  resetForm({ values: novosValores });
});
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="formularioSujo" />

  <LoadingComponent v-if="chamadasPendentes.emFoco" />

  <form
    v-else
    class="flex column g2"
    @submit.prevent="onSubmit"
  >
    <div class="flex g2">
      <div class="f1">
        <SmaeLabel
          name="nome"
          :schema="schema"
        />
        <Field
          id="nome"
          name="nome"
          type="text"
          class="inputtext light"
          maxlength="255"
        />
        <ErrorMessage
          name="nome"
          class="error-msg"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="ativo"
          required
          :schema="schema"
        />
        <Field
          id="ativo"
          name="ativo"
          as="select"
          class="inputtext light"
        >
          <option :value="true">
            Sim
          </option>
          <option :value="false">
            Não
          </option>
        </Field>
        <ErrorMessage
          name="ativo"
          class="error-msg"
        />
      </div>
    </div>

    <FieldArray
      v-slot="{ fields, push, remove }"
      name="acoes"
    >
      <div class="flex column g2">
        <div
          v-for="(field, idx) in fields"
          :key="`acoes--${field.key}`"
        >
          <Field
            :name="`acoes[${idx}].id`"
            type="hidden"
          />

          <div class="flex g2">
            <div class="f1">
              <SmaeLabel :name="`acoes[${idx}].nome`">
                Ação {{ idx + 1 }}
              </SmaeLabel>
              <Field
                :id="`acoes[${idx}].nome`"
                :name="`acoes[${idx}].nome`"
                type="text"
                class="inputtext light"
                maxlength="255"
              />
              <ErrorMessage
                :name="`acoes[${idx}].nome`"
                class="error-msg"
              />
            </div>

            <div class="f1">
              <SmaeLabel :name="`acoes[${idx}].ativo`">
                Ativa
              </SmaeLabel>
              <div class="flex g1">
                <Field
                  :id="`acoes[${idx}].ativo`"
                  :name="`acoes[${idx}].ativo`"
                  as="select"
                  class="inputtext light"
                >
                  <option :value="true">
                    Sim
                  </option>
                  <option :value="false">
                    Não
                  </option>
                </Field>

                <button
                  class="like-a__text"
                  type="button"
                  aria-label="Excluir"
                  title="Excluir"
                  @click="remove(idx)"
                >
                  <svg
                    width="20"
                    height="20"
                  >
                    <use xlink:href="#i_remove" />
                  </svg>
                </button>
              </div>
              <ErrorMessage
                :name="`acoes[${idx}].ativo`"
                class="error-msg"
              />
            </div>
          </div>
        </div>

        <div>
          <button
            class="like-a__text addlink"
            type="button"
            @click="push({ nome: '', ativo: true })"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_+" />
            </svg>
            <span>adicionar nova ação</span>
          </button>
        </div>

        <ErrorMessage
          name="acoes"
          class="error-msg"
        />
      </div>
    </FieldArray>

    <FormErrorsList :errors="errors" />

    <SmaeFieldsetSubmit :disabled="isSubmitting" />
  </form>
</template>
