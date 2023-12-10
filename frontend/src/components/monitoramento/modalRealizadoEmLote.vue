<script setup>
import auxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';
import dateToField from '@/helpers/dateToField';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useCiclosStore } from '@/stores/ciclos.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { storeToRefs } from 'pinia';
import { valoresRealizadoEmLote as schema } from '@/consts/formSchemas';
import {
  Field,
  FieldArray,
  ErrorMessage,
  useForm,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const { meta_id } = route.params;

// PRA-FAZER: remover as prop desnecessárias
const pr = defineProps(['props']);
const { props } = pr;

const CiclosStore = useCiclosStore();
const { índiceDeSériesEmMetaVars } = storeToRefs(CiclosStore);

const linhasAbertas = ref([]);
const valorPadrãoParaAnáliseQualitativa = ref('');
const valorPadrãoParaRealizado = ref(null);
const valorPadrãoParaRealizadoAcumulado = ref(null);

const valoresIniciais = computed(() => ({
  linhas: !Array.isArray(props.variávelComposta?.variaveis)
    ? [{
      analise_qualitativa: '',
      data_valor: null,
      enviar_para_cp: false,
      valor_realizado_acumulado: 0,
      valor_realizado: 0,
      variavel_id: 0,
    }]
    : props.variávelComposta.variaveis.reduce((acc, cur) => acc.concat(
      cur.series.map((y) => ({
        analise_qualitativa: '',
        codigo: cur.variavel.codigo,
        data_valor: y.periodo,
        enviar_para_cp: false,
        titulo: cur.variavel.titulo,
        valor_realizado_acumulado:
          y.series[índiceDeSériesEmMetaVars.value.RealizadoAcumulado]?.valor_nominal,
        valor_realizado: y.series[índiceDeSériesEmMetaVars.value.Realizado]?.valor_nominal,
        variavel_id: cur.variavel.id,
      })),
    ), []),
}));

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values: carga,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    console.debug('carga', carga);

    const r = await CiclosStore.salvarVariáveisCompostasEmLote(carga);
    const msg = 'Dados salvos com sucesso!';

    if (r === true) {
      editModalStore.clear();
      alertStore.success(msg);
      CiclosStore.getMetaVars(meta_id);
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function submeterAoCP() {
  console.debug(95);
  alertStore.confirmAction(
    'Deseja submeter as informações? Após o envio, os dados só poderão ser editados pela coordenadoria de planejamento ou em caso de solicitação de complementação.',
    () => {
      carga.linhas.forEach((_x, i) => {
        setFieldValue(`linhas[${i}].enviar_para_cp`, true);
      });
      onSubmit();
      alertStore.clear();
    },
    'Enviar',
  );
}

function preencher(quais) {
  if (quais === 'todos') {
    carga.linhas.forEach((_x, i) => {
      setFieldValue(`linhas[${i}].analise_qualitativa`, valorPadrãoParaAnáliseQualitativa.value);
      setFieldValue(`linhas[${i}].valor_realizado`, valorPadrãoParaRealizado.value);
      setFieldValue(`linhas[${i}].valor_realizado_acumulado`, valorPadrãoParaRealizadoAcumulado.value);
    });
  }

  if (quais === 'vazios') {
    carga.linhas.forEach((x, i) => {
      if (!!valorPadrãoParaAnáliseQualitativa.value && !x.analise_qualitativa) {
        setFieldValue(`linhas[${i}].analise_qualitativa`, valorPadrãoParaAnáliseQualitativa.value);
      }
      if (!!valorPadrãoParaRealizado.value && !x.valor_realizado) {
        setFieldValue(`linhas[${i}].valor_realizado`, valorPadrãoParaRealizado.value);
      }
      if (!!valorPadrãoParaRealizadoAcumulado.value && !x.valor_realizado_acumulado) {
        setFieldValue(`linhas[${i}].valor_realizado_acumulado`, valorPadrãoParaRealizadoAcumulado.value);
      }
    });
  }
}

function restaurarFormulário() {
  resetForm();
}
watch(valoresIniciais, (novoValor) => {
  resetForm({ values: novoValor });
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>Edição de valores realizados em lote</h2>
    <hr class="ml2 f1">
    <span>
      <!-- PRA-FAZER: trocar por componente -->
      <button
        class="btn round ml2"
        @click="props.checkClose"
      ><svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg></button>
    </span>
  </div>

  <div class="flex center mb2">
    <svg
      class="f0 tlaranja mr1"
      style="flex-basis: 2rem;"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    ><use
      :xlink:href="`#i_${props.parent.atividade
        ? 'atividade'
        : props.parent.iniciativa
          ? 'iniciativa'
          : 'indicador'}`"
    /></svg>
    <div class="t20">
      <strong>{{ props.parent.indicador.codigo }} {{ props.parent.indicador.titulo }}</strong>
    </div>
  </div>

  <h3 class="t20 mb2 w700">
    {{ props.variávelComposta?.titulo }}
  </h3>

  <auxiliarDePreenchimento>
    <div class="flex g2 end mb1">
      <div class="f1">
        <label class="label">Realizados</label>
        <input
          v-model="valorPadrãoParaRealizado"
          type="number"
          min="0"
          class="inputtext light mb1"
        >
      </div>
      <div class="f1">
        <label class="label">Acumulados</label>
        <input
          v-model="valorPadrãoParaRealizadoAcumulado"
          type="number"
          min="0"
          class="inputtext light mb1"
        >
      </div>
    </div>

    <div class="flex g2 end mb1">
      <div class="f1">
        <label class="label">Análise qualitativa</label>
        <textarea
          v-model="valorPadrãoParaAnáliseQualitativa"
          class="inputtext light mb1"
        />
      </div>
    </div>

    <div class="flex g2 mb1 center">
      <hr class="f1">
      <button
        type="button"
        class="f0 btn bgnone outline tcprimary"
        @click="preencher('vazios')"
      >
        Preencher vazios
      </button>
      <button
        type="button"
        class="f0 btn bgnone outline tcprimary"
        @click="preencher('todos')"
      >
        Preencher todos
      </button>
      <button
        type="reset"
        class="f0 pl0 pr0 btn bgnone"
        @click.prevent="restaurarFormulário"
      >
        &times; restaurar
      </button>
      <hr class="f1">
    </div>
  </auxiliarDePreenchimento>

  <form
    :disabled="isSubmitting"
    @submit="onSubmit"
  >
    <table class="tablemain no-zebra mb1">
      <thead>
        <th />
        <th>código</th>
        <th>Referência</th>
        <th>realizado</th>
        <th>Realizado acumulado</th>
      </thead>
      <FieldArray
        v-slot="{ fields }"
        name="linhas"
      >
        <tbody
          v-for="(field, idx) in fields"
          :key="idx"
        >
          <tr>
            <td class="accordeon">
              <label
                class="center like-a__text"
                aria-label="exibir análie qualitativa"
                style="min-width:13px; min-height:13px"
              >
                <input
                  v-model="linhasAbertas"
                  type="checkbox"
                  :value="field.value.variavel_id"
                  hidden
                >
                <svg
                  v-if="linhasAbertas.includes(field.value.variavel_id)"
                  class="arrow"
                  width="8"
                  height="13"
                ><use xlink:href="#i_right" /></svg>
                <svg
                  v-else
                  class="arrow"
                  width="13"
                  height="8"
                ><use xlink:href="#i_down" /></svg>
              </label>
            </td>
            <td>
              <Field
                :name="`linhas[${idx}].variavel_id`"
                :value="field.value.variavel_id"
                type="hidden"
              />
              {{ field.value.codigo }}
            </td>
            <td>
              {{ dateToField(field.value.data_valor) }}
            </td>
            <td>
              <Field
                :name="`linhas[${idx}].valor_realizado`"
                type="number"
                :value="field.value.valor_realizado"
                :step="1"
                class="inputtext light"
                :class="{ 'error': errors[`linhas[${idx}].valor_realizado`] }"
                @update:model-value="() => {
                  if (carga.linhas[idx].valor_realizado === '') {
                    setFieldValue(`linhas[${idx}].valor_realizado`, null);
                  }
                }"
              />
              <ErrorMessage
                class="error-msg mt1"
                :name="`linhas[${idx}].valor_realizado`"
              />
            </td>
            <td>
              <Field
                :name="`linhas[${idx}].valor_realizado_acumulado`"
                type="number"
                :value="field.valor_realizado_acumulado"
                :step="1"
                class="inputtext light"
                :class="{ 'error': errors[`linhas[${idx}].valor_realizado_acumulado`] }"
                @update:model-value="() => {
                  if (carga.linhas[idx].valor_realizado_acumulado === '') {
                    setFieldValue(`linhas[${idx}].valor_realizado_acumulado`, null);
                  }
                }"
              />
              <ErrorMessage
                class="error-msg mt1"
                :name="`linhas[${idx}].valor_realizado_acumulado`"
              />
            </td>
          </tr>
          <tr v-show="linhasAbertas.includes(field.value.variavel_id)">
            <td colspan="5">
              <label class="label tc300">Análise qualitativa</label>
              <Field
                :name="`linhas[${idx}].analise_qualitativa`"
                as="textarea"
                :value="field.analise_qualitativa"
                rows="3"
                class="inputtext light mb1"
                :class="{ 'error': errors[`linhas[${idx}].analise_qualitativa`] }"
              />

              <ErrorMessage
                class="error-msg mb1"
                :name="`linhas[${idx}].analise_qualitativa`"
              />
            </td>
          </tr>
        </tbody>
      </FieldArray>
    </table>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        type="submit"
        class="btn outline bgnone tcprimary big mr1"
        :disabled="isSubmitting"
      >
        Salvar
      </button>
      <button
        v-if="perm.PDM?.ponto_focal"
        class="btn big"
        type="button"
        :disabled="isSubmitting"
        @click="submeterAoCP"
      >
        Salvar e submeter
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
