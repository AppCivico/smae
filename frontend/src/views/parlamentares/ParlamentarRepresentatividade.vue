<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { representatividade as schema } from '@/consts/formSchemas';
import tiposDeMunicípio from '@/consts/tiposDeMunicipio';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { useRegionsStore } from '@/stores/regions.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits(['close']);
const props = defineProps({
  apenasEmitir: {
    type: Boolean,
    default: false,
  },
  parlamentarId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
  representatividadeId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
  tipo: {
    type: String,
    default: '',
  },
});

const tipoSugerido = props.tipo
  ? tiposDeMunicípio
    .find((x) => x.toLowerCase() === props.tipo.toLocaleLowerCase())
  : '';

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();
const regionsStore = useRegionsStore();

const {
  emFoco, chamadasPendentes, erro, representatividadeParaEdição,
} = storeToRefs(parlamentaresStore);

const { regions: regiões, regiõesPorNível } = storeToRefs(regionsStore);

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, setFieldValue, values,
} = useForm({
  initialValues: representatividadeParaEdição.value,
  validationSchema: schema,
});

const éCapital = computed(() => values.municipio_tipo === 'Capital');

const mandatosEmSp = computed(() => {
  const { mandatos } = emFoco.value;
  return mandatos ? mandatos.filter((mandato) => mandato.uf === 'SP') : [];
});

const regiõesFiltradas = computed(() => {
  switch (values.municipio_tipo) {
    case 'Capital':
      return regiõesPorNível.value[3]?.slice()
        .sort((a, b) => a.descricao.localeCompare(b.descricao));
    case 'Interior':
      return regiõesPorNível.value[1]?.slice()
        .sort((a, b) => a.descricao.localeCompare(b.descricao));
    default:
      return [];
  }
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    if (await parlamentaresStore.salvarRepresentatividade(
      valoresControlados,
      props.representatividadeId,
      props.parlamentarId,
    )) {
      parlamentaresStore.buscarItem(props.parlamentarId);

      alertStore.success('Representatividade atualizada!');
      if (props.apenasEmitir) {
        emit('close');
      } else if (route.meta.rotaDeEscape) {
        router.push({
          name: route.meta.rotaDeEscape,
          params: route.params,
          query: route.query,
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const formularioSujo = useIsFormDirty();

function definirCampoNível(valor) {
  switch (valor) {
    case 'Capital':
      setFieldValue('nivel', 'Subprefeitura');
      break;
    case 'Interior':
      setFieldValue('nivel', 'Municipio');
      break;
    default:
      setFieldValue('nivel', '');
      break;
  }
}

function iniciar() {
  if (!regiões.value.length) {
    regionsStore.getAll();
  }

  if (!parlamentaresStore.emFoco?.id !== Number(route.params?.parlamentarId)) {
    if (route.params?.parlamentarId) {
      parlamentaresStore.buscarItem(route.params?.parlamentarId);
    } else {
      alertStore.error('Você não está editando uma representatividade');
    }
  }
}

iniciar();

watch(representatividadeParaEdição, (novoValor) => {
  resetForm({ values: novoValor });

  if (!values.municipio_tipo && tipoSugerido) {
    resetField('municipio_tipo', { value: tipoSugerido });
    definirCampoNível(tipoSugerido);
  }

  // rodar imediatamente apenas por causa do tipo sugerido
}, { immediate: true });
</script>

<template>
  <SmallModal @close="emit('close')">
    <div class="flex spacebetween center mb2">
      <TítuloDePágina>
        Representatividade parlamentar
      </TítuloDePágina>

      <hr class="ml2 f1">

      <CheckClose
        :apenas-emitir="props.apenasEmitir"
        :formulario-sujo="formularioSujo"
        @close="emit('close')"
      />
    </div>

    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
    >
      <div class="flex flexwrap g2 mb1">
        <Field
          v-if="!props.representatividadeId"
          name="nivel"
          type="hidden"
        />

        <div
          v-if="!props.representatividadeId"
          class="f1"
          :hidden="!!tipoSugerido"
        >
          <LabelFromYup
            name="municipio_tipo"
            :schema="schema"
          />
          <Field

            name="municipio_tipo"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.municipio_tipo, loading: chamadasPendentes.emFoco }"
            @change="(e) => definirCampoNível(e.target.value) "
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="tipo in tiposDeMunicípio"
              :key="tipo"
              :value="tipo"
            >
              {{ tipo }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="municipio_tipo"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            name="regiao_id"
            :schema="schema"
          >
            {{ éCapital ? 'Região' : 'Município' }}
          </LabelFromYup>
          <Field
            v-if="!props.representatividadeId"
            name="regiao_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.regiao_id, loading: chamadasPendentes.emFoco }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="região in regiõesFiltradas"
              :key="região.id"
              :value="região.id"
            >
              {{ região.descricao }}
            </option>
          </Field>
          <input
            v-else
            type="text"
            disabled
            class="inputtext light mb1"
            :value="representatividadeParaEdição?.regiao?.descricao"
            :class="{ loading: chamadasPendentes.emFoco }"
          >
          <ErrorMessage
            class="error-msg"
            name="regiao_id"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            name="mandato_id"
            :schema="schema"
          />

          <Field
            v-if="!props.representatividadeId"
            name="mandato_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.mandato_id, loading: chamadasPendentes.emFoco }"
          >
            <option :value="0">
              Selecionar
            </option>
            <option
              v-for="mandato in mandatosEmSp || []"
              :key="mandato.id"
              :value="mandato.id"
            >
              {{ mandato.eleicao?.tipo }} -
              {{ mandato.eleicao?.ano || mandato.id }}
            </option>
          </Field>
          <input
            v-else
            class="inputtext light mb1 disabled"
            :value="representatividadeParaEdição?.mandato?.tipo + ' - ' + representatividadeParaEdição?.mandato?.ano"
            disabled
            :class="{ loading: chamadasPendentes.emFoco }"
          >
          <ErrorMessage
            class="error-msg"
            name="mandato_id"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="numero_votos"
            :schema="schema"
          />
          <Field
            name="numero_votos"
            type="number"
            class="inputtext light mb1"
            :class="{ error: errors.numero_votos, loading: chamadasPendentes.emFoco }"
            min="0"
            step="1"
            @change="setFieldValue('numero_votos', $event.target.value ? Number($event.target.value) : null)"
          />
          <ErrorMessage
            class="error-msg"
            name="numero_votos"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="numero_comparecimento"
            :schema="schema"
          />
          <Field
            v-if="!props.representatividadeId"
            name="numero_comparecimento"
            type="number"
            class="inputtext light mb1"
            :class="{ error: errors.numero_comparecimento, loading: chamadasPendentes.emFoco }"
            min="0"
            step="1"
            @change="setFieldValue('numero_comparecimento', $event.target.value ? Number($event.target.value) : null)"
          />
          <input
            v-else
            class="inputtext light mb1 disabled"
            :value="representatividadeParaEdição?.regiao?.comparecimento?.valor"
            disabled
            :class="{ loading: chamadasPendentes.emFoco }"
          >
          <ErrorMessage
            class="error-msg"
            name="numero_comparecimento"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="pct_participacao"
            :schema="schema"
          />
          <Field
            name="pct_participacao"
            type="number"
            class="inputtext light mb1"
            :class="{ error: errors.pct_participacao, loading: chamadasPendentes.emFoco }"
            min="0"
            step="0.01"
            @change="setFieldValue('pct_participacao', $event.target.value ? Number($event.target.value) : null)"
          />
          <ErrorMessage
            class="error-msg"
            name="pct_participacao"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="ranking"
            :schema="schema"
          />
          <Field
            name="ranking"
            type="number"
            class="inputtext light mb1"
            :class="{ error: errors.ranking, loading: chamadasPendentes.emFoco }"
            max="1000"
            min="0"
            step="1"
            @change="setFieldValue('ranking', $event.target.value ? Number($event.target.value) : null)"
          />
          <ErrorMessage
            class="error-msg"
            name="ranking"
          />
        </div>
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
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>

    <LoadingComponent v-if="chamadasPendentes.equipe" />

    <div
      v-if="erro"
      class="error p1"
    >
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </SmallModal>
</template>
