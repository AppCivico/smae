<script setup>
import SmallModal from '@/components/SmallModal.vue';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import estadosDoBrasil from '@/consts/estadosDoBrasil';
import { mandato as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();
const partidosStore = usePartidosStore();

const {
  chamadasPendentes, erro, mandatoParaEdição, eleições, idsDasEleiçõesQueParlamentarConcorreu,
} = storeToRefs(parlamentaresStore);

const {
  lista: listaDePartidos,
  chamadasPendentes: { lista: esperandoListaDePartidos },
  erro: erroNaListaDePartidos,
} = storeToRefs(partidosStore);

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, setFieldValue, values: carga,
} = useForm({
  initialValues: mandatoParaEdição.value,
  validationSchema: schema,
});

const eleiçõesDisponíveisParaEdição = computed(() => eleições
  .value?.filter((x) => x.atual_para_mandatos) || []);
const eleiçãoEscolhida = ref(0);

const dadosDaEleiçãoEscolhida = computed(() => eleições
  .value?.find((y) => y.id === carga.eleicao_id));

const cargosDisponíveisParaEdição = computed(() => Object.values(cargosDeParlamentar)
  .filter((x) => x.tipo === dadosDaEleiçãoEscolhida.value?.tipo) || []);

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    if (await parlamentaresStore.salvarMandato(valoresControlados)) {
      parlamentaresStore.buscarItem(route.params?.parlamentarId);

      alertStore.success('Mandatos atualizados!');
      if (route.meta.rotaDeEscape) {
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

const formulárioSujo = useIsFormDirty();

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

iniciar();

watch(mandatoParaEdição, (novoValor) => {
  resetForm({ values: novoValor });

  eleiçãoEscolhida.value = novoValor.eleicao_id;
});
</script>

<template>
  <SmallModal>
    <div class="flex spacebetween center mb2">
      <TítuloDePágina />
      <hr class="ml2 f1">

      <CheckClose
        :formulário-sujo="formulárioSujo"
      />
    </div>

    <LoadingComponent
      v-if="chamadasPendentes.emFoco"
      class="mb1"
    />

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
            :class="{ 'error': errors.eleicao_id }"
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
            name="cargo"
            :schema="schema"
          />
          <Field
            name="cargo"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.cargo }"
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
            name="uf"
            :schema="schema"
          />
          <Field
            name="uf"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.uf }"
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
        <div class="f1">
          <LabelFromYup
            name="eleito"
            :schema="schema"
          />
          <Field
            name="eleito"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.eleito }"
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
            :class="{ 'error': errors.partido_candidatura_id }"
          >
            <option :value="null">
              Selecionar
            </option>
            <option
              v-for="partido in listaDePartidos"
              :key="partido.id"
              :value="partido.id"
            >
              {{ partido.sigla }} - {{ partido.nome }}
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
              {{ partido.sigla }} - {{ partido.nome }}
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
            :class="{ 'error': errors.votos_estado }"
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
            :class="{ 'error': errors.votos_capital }"
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
            :class="{ 'error': errors.votos_interior }"
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
            name="gabinete"
            :schema="schema"
          />
          <Field
            name="gabinete"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ 'error': errors.gabinete }"
          />
          <ErrorMessage
            class="error-msg"
            name="gabinete"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="endereco"
            :schema="schema"
          />
          <Field
            name="endereco"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ 'error': errors.endereco }"
          />
          <ErrorMessage
            class="error-msg"
            name="endereco"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="atuacao"
            :schema="schema"
          />
          <Field
            name="atuacao"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ 'error': errors.atuacao }"
          />
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
            name="biografia"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ 'error': errors.biografia }"
          />
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
          :title="Object.keys(errors)?.length ? `Erros de preenchimento:
        ${Object.keys(errors)?.length}`
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
