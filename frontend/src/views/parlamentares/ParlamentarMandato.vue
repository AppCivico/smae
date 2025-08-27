<script setup>
import { vMaska } from 'maska';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SmallModal from '@/components/SmallModal.vue';
import TextEditor from '@/components/TextEditor.vue';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import estadosDoBrasil from '@/consts/estadosDoBrasil';
import { mandato as schema } from '@/consts/formSchemas';
import níveisDeSuplência from '@/consts/niveisDeSuplencia';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { usePartidosStore } from '@/stores/partidos.store';

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();
const partidosStore = usePartidosStore();
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
  mandatoId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
});

const {
  chamadasPendentes,
  erro,
  emFoco: parlamentarEmFoco,
  eleições,
  idsDasEleiçõesQueParlamentarConcorreu,
} = storeToRefs(parlamentaresStore);

const {
  lista: listaDePartidos,
  chamadasPendentes: { lista: esperandoListaDePartidos },
  erro: erroNaListaDePartidos,
} = storeToRefs(partidosStore);

const mandatoParaEdição = computed(() => {
  const { mandatoId } = route.params;

  const mandato = mandatoId && Array.isArray(parlamentarEmFoco.value?.mandatos)
    ? parlamentarEmFoco.value.mandatos.find((x) => Number(mandatoId) === x.id)
    : {};

  return {
    ...mandato,
    eleicao_id: mandato?.eleicao?.id,
    partido_atual_id: mandato?.partido_atual?.id,
    partido_candidatura_id: mandato?.partido_candidatura?.id,
    votos_estado: typeof mandato.votos_estado === 'string'
      ? Number(mandato.votos_estado)
      : undefined,
    votos_capital: typeof mandato.votos_capital === 'string'
      ? Number(mandato.votos_capital)
      : undefined,
    votos_interior: typeof mandato.votos_interior === 'string'
      ? Number(mandato.votos_interior)
      : undefined,
  };
});

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, setFieldValue, values: carga,
} = useForm({
  initialValues: mandatoParaEdição.value,
  validationSchema: schema,
});

const eleiçõesDisponíveisParaEdição = computed(() => eleições
  .value?.filter((x) => {
    console.log(x.tipo, x.ano, { x });

    return x.atual_para_mandatos;
  }) || []);
const eleiçãoEscolhida = ref(0);

const dadosDaEleiçãoEscolhida = computed(() => eleições
  .value?.find((y) => y.id === carga.eleicao_id));

const cargosDisponíveisParaEdição = computed(() => Object.values(cargosDeParlamentar)
  .filter((x) => x.tipo === dadosDaEleiçãoEscolhida.value?.tipo) || []);

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    if (await parlamentaresStore.salvarMandato(
      valoresControlados,
      props.mandatoId,
      props.parlamentarId,
    )) {
      parlamentaresStore.buscarItem(route.params?.parlamentarId);

      alertStore.success('Mandatos atualizados!');
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

function iniciar() {
  parlamentaresStore.buscarEleições();

  if (!listaDePartidos.value.length) {
    partidosStore.buscarTudo();
  }

  if (!parlamentaresStore.emFoco?.id !== Number(route.params?.parlamentarId)) {
    if (route.params?.parlamentarId) {
      parlamentaresStore.buscarItem(route.params?.parlamentarId);
    } else {
      alertStore.error('Você não está editando uma parlamentar');
    }
  }
}

watch(mandatoParaEdição, (novoValor) => {
  resetForm({ values: novoValor });

  eleiçãoEscolhida.value = novoValor.eleicao_id;
});

iniciar();

</script>

<template>
  <SmallModal @close="emit('close')">
    <div class="flex spacebetween center mb2">
      <TítuloDePágina>
        Mandato legislativo
      </TítuloDePágina>
      <hr class="ml2 f1">

      <CheckClose
        :apenas-emitir="props.apenasEmitir"
        :formulario-sujo="formularioSujo"
        @close="emit('close')"
      />
    </div>

    <pre v-ScrollLockDebug>
      carga:{{ carga }}
    </pre>

    <form
      :disabled="isSubmitting"
      @submit="onSubmit"
    >
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="eleicao_id"
            :schema="schema"
          />
          <Field
            v-model.number="eleiçãoEscolhida"
            name="eleicao_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.eleicao_id, loading: chamadasPendentes.emFoco }"
            @change="resetField('cargo', null)"
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
            name="eleicao_id"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="eleito"
            :schema="schema"
          />
          <Field
            name="eleito"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.eleito, loading: chamadasPendentes.emFoco }"
          >
            <option :value="false">
              não
            </option>
            <option :value="true">
              sim
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="eleito"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="cargo"
            :schema="schema"
          />
          <Field
            name="cargo"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.cargo, loading: chamadasPendentes.emFoco }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="cargo in cargosDisponíveisParaEdição"
              :key="cargo.valor"
              :value="cargo.valor"
            >
              {{ cargo.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="cargo"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="suplencia"
            :schema="schema"
          />
          <Field
            name="suplencia"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.suplencia, loading: chamadasPendentes.emFoco }"
          >
            <option :value="null" />
            <option
              v-for="nível in níveisDeSuplência"
              :key="nível.valor"
              :value="nível.valor"
            >
              {{ nível.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="suplencia"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="uf"
            :schema="schema"
          />
          <Field
            name="uf"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.uf, loading: chamadasPendentes.emFoco }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="uf in estadosDoBrasil"
              :key="uf.sigla"
              :value="uf.sigla"
            >
              {{ uf.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="uf"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div
          class="f2"
          :class="{ loading: esperandoListaDePartidos }"
        >
          <LabelFromYup
            name="partido_candidatura_id"
            :schema="schema"
          />
          <Field
            name="partido_candidatura_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.partido_candidatura_id, loading: chamadasPendentes.emFoco }"
          >
            <option :value="null">
              Selecionar
            </option>
            <option
              v-for="partido in listaDePartidos"
              :key="partido.id"
              :value="partido.id"
            >
              {{ partido.sigla }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="partido_candidatura_id"
          />
        </div>
        <div
          class="f2"
          :class="{ loading: esperandoListaDePartidos }"
        >
          <LabelFromYup
            name="partido_atual_id"
            :schema="schema"
          />
          <Field
            name="partido_atual_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.partido_atual_id }"
          >
            <option :value="null">
              Selecionar
            </option>
            <option
              v-for="partido in listaDePartidos"
              :key="partido.id"
              :value="partido.id"
            >
              {{ partido.sigla }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="partido_atual_id"
          />
        </div>

        <ErrorComponent
          v-if="erroNaListaDePartidos"
          class="fb100"
        >
          {{ erroNaListaDePartidos }}
        </ErrorComponent>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="votos_estado"
            :schema="schema"
          />
          <Field
            name="votos_estado"
            type="number"
            class="inputtext light mb1"
            :class="{ error: errors.votos_estado, loading: chamadasPendentes.emFoco }"
            min="0"
            step="1"
            @change="setFieldValue(
              'votos_estado',
              $event.target.value ? Number($event.target.value) : null
            )"
          />
          <ErrorMessage
            class="error-msg"
            name="votos_estado"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="votos_capital"
            :schema="schema"
          />
          <Field
            name="votos_capital"
            type="number"
            class="inputtext light mb1"
            :class="{ error: errors.votos_capital, loading: chamadasPendentes.emFoco }"
            min="0"
            step="1"
            @change="setFieldValue(
              'votos_capital',
              $event.target.value ? Number($event.target.value) : null
            )"
          />
          <ErrorMessage
            class="error-msg"
            name="votos_capital"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="votos_interior"
            :schema="schema"
          />
          <Field
            name="votos_interior"
            type="number"
            class="inputtext light mb1"
            :class="{ error: errors.votos_interior, loading: chamadasPendentes.emFoco }"
            min="0"
            step="1"
            @change="setFieldValue(
              'votos_interior',
              $event.target.value ? Number($event.target.value) : null
            )"
          />
          <ErrorMessage
            class="error-msg"
            name="votos_interior"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="telefone"
            :schema="schema"
          />
          <Field
            v-maska
            name="telefone"
            type="text"
            class="inputtext light mb1"
          />
          <ErrorMessage
            class="error-msg"
            name="telefone"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            name="email"
            :schema="schema"
          />
          <Field
            name="email"
            type="text"
            class="inputtext light mb1"
            @change="($e) => {
              if (!$e.target.value) setFieldValue('email', null);
            }"
          />
          <ErrorMessage
            class="error-msg"
            name="email"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            name="gabinete"
            :schema="schema"
          />
          <Field
            name="gabinete"
            type="text"
            class="inputtext light mb1"
            :class="{ error: errors.gabinete, loading: chamadasPendentes.emFoco }"
          />
          <ErrorMessage
            class="error-msg"
            name="gabinete"
          />
        </div>
      </div>

      <div class="f1">
        <LabelFromYup
          name="endereco"
          :schema="schema"
        />
        <Field
          name="endereco"
          type="text"
          class="inputtext light mb1"
          :class="{ error: errors.endereco, loading: chamadasPendentes.emFoco }"
        />
        <ErrorMessage
          class="error-msg"
          name="endereco"
        />
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="atuacao"
            :schema="schema"
          />
          <Field
            v-slot="{ field }"
            name="atuacao"
          >
            <TextEditor
              v-bind="field"
            />
          </Field>
          <ErrorMessage
            class="error-msg"
            name="atuacao"
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
            v-slot="{ field }"
            name="biografia"
          >
            <TextEditor
              v-bind="field"
            />
          </Field>
          <ErrorMessage
            class="error-msg"
            name="biografia"
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
