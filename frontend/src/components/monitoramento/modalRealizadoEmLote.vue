<script setup>
import auxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';
import { valoresRealizadoEmLote as schema, arquivoSimples as uploadSchema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import geradorDeAtributoStep from '@/helpers/geradorDeAtributoStep';
import nulificadorTotal from '@/helpers/nulificadorTotal';
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useCiclosStore } from '@/stores/ciclos.store';
import { useDocumentTypesStore } from '@/stores/documentTypes.store';
import { useEditModalStore } from '@/stores/editModal.store';
import Big from 'big.js';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  Form,
  useForm,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const documentTypesStore = useDocumentTypesStore();
const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const route = useRoute();
const { meta_id } = route.params;

// PRA-FAZER: remover as prop desnecessárias
const pr = defineProps(['props']);
// BUG-CONHECIDO: explodir as props as faz perder reatividade. Já que esse modal
// não tem rota, é provável, mas não garantido, que não dê problemas.
const { props } = pr;

const CiclosStore = useCiclosStore();
const {
  índiceDeSériesEmMetaVars, dadosExtrasDeComposta, dadosExtrasPorVariávelId, MetaVars,
  variaveisPorId,
} = storeToRefs(CiclosStore);

const linhasAbertas = ref([]);
const modoDePreenchimento = ref('valor_realizado'); // ou `valor_realizado_acumulado`
const valorPadraoParaAnaliseQualitativa = ref('');
const valorPadraoParaRealizado = ref('');
const valorPadraoParaRealizadoAcumulado = ref('');

const variaveisComSuasDatas = computed(() => (Array.isArray(props.variávelComposta?.variaveis)
  ? props.variávelComposta.variaveis.reduce((acc, cur) => acc.concat(
    cur.series.map((y) => ({
      data_valor: y.periodo,
      variavel_id: cur.variavel.id,
    })),
  ), [])
  : []));

const valoresIniciais = computed(() => ({
  composta: {
    data_ciclo: MetaVars.value.data_ciclo,
    formula_composta_id: props.variávelComposta?.id,
    analise_qualitativa: dadosExtrasDeComposta.value?.analises?.[0]?.analise_qualitativa || '',
    enviar_para_cp: dadosExtrasDeComposta.value?.analises?.[0]?.enviado_para_cp || false,
  },
  linhas: !Array.isArray(props.variávelComposta?.variaveis)
    ? [{
      analise_qualitativa: '',
      data_valor: null,
      enviar_para_cp: false,
      valor_realizado_acumulado: '0',
      valor_realizado: '0',
      variavel_id: 0,
    }]
    : props.variávelComposta.variaveis.reduce((acc, cur) => (cur.series[0]?.pode_editar
      ? acc.concat(
        cur.series.map((y) => ({
          analise_qualitativa: dadosExtrasPorVariávelId.value?.[cur.variavel.id]?.analises?.[0]?.analise_qualitativa || '',
          codigo: cur.variavel.codigo,
          data_valor: y.periodo,
          enviar_para_cp: false,
          titulo: cur.variavel.titulo,
          valor_realizado_acumulado: dadosExtrasPorVariávelId.value?.[cur.variavel.id]?.acumulativa
            ? y.series[índiceDeSériesEmMetaVars.value.RealizadoAcumulado]?.valor_nominal
            : null,
          valor_realizado: y.series[índiceDeSériesEmMetaVars.value.Realizado]?.valor_nominal
            ?? null,
          variavel_id: cur.variavel.id,
        })),
      )
      : acc), []),
}));

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values: carga,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

const permitirSubmissaoAoCP = computed(() => Array.isArray(carga.linhas)
  && !carga.linhas
    .find((x) => (x.valor_realizado_acumulado !== undefined && !x.valor_realizado_acumulado)
      || !x.valor_realizado));

const edicaoProibidaAposConferencia = computed(() => MetaVars.perfil === 'ponto_focal'
  && dadosExtrasDeComposta.value?.analises?.[0]?.enviado_para_cp);

const onSubmit = handleSubmit(async () => {
  try {
    const [primeira, segunda] = await Promise.all([
      CiclosStore.salvarVariáveisCompostasEmLote({ linhas: nulificadorTotal(carga.linhas) }),
      CiclosStore.salvarVariávelComposta(nulificadorTotal(carga.composta)),
    ]);

    if (!primeira || !segunda) {
      throw new Error('Nem todos os dados foram salvos!');
    }

    const msg = 'Dados salvos!';

    editModalStore.clear();
    alertStore.success(msg);
    CiclosStore.getMetaVars(meta_id);
  } catch (error) {
    alertStore.error(error);
  }
});

const soma = computed(() => carga.linhas?.reduce((acc, cur) => ({
  valor_realizado: acc.valor_realizado + Number(cur.valor_realizado || 0),
  valor_realizado_acumulado: acc.valor_realizado_acumulado
    + Number(cur.valor_realizado_acumulado || 0),
}), {
  valor_realizado: 0,
  valor_realizado_acumulado: 0,
}));

function atualizarOutroValor(outroCampo, variavelId, indiceDaCarga) {
  const {
    Realizado: indiceDeRealizado,
    RealizadoAcumulado: indiceDeRealizadoAcumulado,
  } = índiceDeSériesEmMetaVars.value;

  const series = variaveisPorId.value[variavelId]?.series?.[0]?.series;

  let valorOriginalDoOutroCampo;
  let valorPreenchido;
  let novoValorDoOutroCampo;

  if (outroCampo === 'valor_realizado_acumulado') {
    valorOriginalDoOutroCampo = series?.[indiceDeRealizadoAcumulado]?.valor_nominal;
    valorPreenchido = carga.linhas[indiceDaCarga].valor_realizado;
  } else if (outroCampo === 'valor_realizado') {
    valorOriginalDoOutroCampo = series?.[indiceDeRealizado]?.valor_nominal;
    valorPreenchido = carga.linhas[indiceDaCarga].valor_realizado_acumulado;
  } else {
    throw new Error('Tipo de preenchimento desconhecido!');
  }

  if (valorPreenchido !== '') {
    const realizadoOriginal = series?.[indiceDeRealizado]?.valor_nominal || 0;
    const acumuladoOriginal = series?.[indiceDeRealizadoAcumulado]?.valor_nominal || 0;
    const diferenca = new Big(acumuladoOriginal).minus(realizadoOriginal);

    const casasDecimais = variaveisPorId.value[variaveisPorId]?.variavel?.casas_decimais || 0;

    novoValorDoOutroCampo = (outroCampo === 'valor_realizado'
      ? new Big(valorPreenchido).minus(diferenca)
      : new Big(valorPreenchido).plus(diferenca)).toFixed(casasDecimais);
  } else {
    novoValorDoOutroCampo = valorOriginalDoOutroCampo;
  }

  setFieldValue(`linhas[${indiceDaCarga}].${outroCampo}`, novoValorDoOutroCampo);
}

function submeterAoCP() {
  alertStore.confirmAction(
    'Deseja submeter as informações? Após o envio, os dados só poderão ser editados pela coordenadoria de planejamento ou em caso de solicitação de complementação.',
    () => {
      setFieldValue('composta.enviar_para_cp', true);

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
      setFieldValue(`linhas[${i}].analise_qualitativa`, valorPadraoParaAnaliseQualitativa.value);
      setFieldValue(`linhas[${i}].valor_realizado`, valorPadraoParaRealizado.value);
      setFieldValue(`linhas[${i}].valor_realizado_acumulado`, valorPadraoParaRealizadoAcumulado.value);
    });
  }

  if (quais === 'vazios') {
    carga.linhas.forEach((x, i) => {
      if (!!valorPadraoParaAnaliseQualitativa.value && !x.analise_qualitativa) {
        setFieldValue(`linhas[${i}].analise_qualitativa`, valorPadraoParaAnaliseQualitativa.value);
      }
      if (valorPadraoParaRealizado.value !== '' && !x.valor_realizado) {
        setFieldValue(`linhas[${i}].valor_realizado`, valorPadraoParaRealizado.value);
      }
      if (valorPadraoParaRealizadoAcumulado.value !== '' && !x.valor_realizado_acumulado) {
        setFieldValue(`linhas[${i}].valor_realizado_acumulado`, valorPadraoParaRealizadoAcumulado.value);
      }
    });
  }
}

function restaurarFormulário() {
  resetForm();
}

const virtualUpload = ref({});

async function addArquivo(values) {
  try {
    let msg;
    let r;

    virtualUpload.value.loading = true;
    values.tipo = 'DOCUMENTO';
    const formData = new FormData();

    Object.entries(values).forEach((x) => {
      formData.append(x[0], x[1]);
    });

    const u = await requestS.upload(`${baseUrl}/upload`, formData);

    if (u.upload_token) {
      r = await CiclosStore.addArquivoComposta({
        data_ciclo: MetaVars.value.data_ciclo,
        formula_composta_id: props.variávelComposta?.id,
        upload_token: u.upload_token,
      }, values);
      if (r === true) {
        msg = 'Item adicionado com sucesso!';
        alertStore.success(msg);
        virtualUpload.value = {};

        CiclosStore.buscarDadosExtrasDeComposta({
          data_ciclo: MetaVars.value.data_ciclo,
          formula_composta_id: props.variávelComposta?.id,
          apenas_ultima_revisao: true,
        });
      }
    } else {
      virtualUpload.value.loading = false;
    }
  } catch (error) {
    alertStore.error(error);
    virtualUpload.value.loading = false;
  }
}

function deleteArquivo(id) {
  alertStore.confirmAction('Deseja remover o arquivo?', async () => {
    await CiclosStore.deleteArquivoComposta(id);

    CiclosStore.buscarDadosExtrasDeComposta({
      data_ciclo: MetaVars.value.data_ciclo,
      formula_composta_id: props.variávelComposta?.id,
      apenas_ultima_revisao: true,
    });
  }, 'Remover');
}

function addFile(e) {
  const { files } = e.target;
  virtualUpload.value.name = files[0].name;
  virtualUpload.value.file = files[0];
}

watch(valoresIniciais, (novoValor) => {
  resetForm({ values: novoValor });
});

// BUG-CONHECIDO: deve acabar rodando apenas uma vez por causa da perda de
// reatividade na explosão das props. Precisa-se corrigir isso!
watch(() => props.variávelComposta, (novoValor) => {
  if (novoValor?.id) {
    CiclosStore.buscarDadosExtrasDeComposta({
      data_ciclo: MetaVars.value.data_ciclo,
      formula_composta_id: novoValor.id,
      apenas_ultima_revisao: true,
    });
  }
}, { immediate: true });

watch(variaveisComSuasDatas, (novoValor) => {
  if (novoValor.length) {
    CiclosStore.buscarDadosExtrasDeVariáveis({ linhas: novoValor });
  }
}, { immediate: true });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>Edição de valores realizados em lote</h2>
    <hr class="ml2 f1">

    <CheckClose :apenas-modal="true" />
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

  <form
    :disabled="isSubmitting"
    @submit.prevent="onSubmit"
  >
    <div class="flex mb1">
      <div class="f1">
        <label class="label tc300">Análise qualitativa</label>
        <Field
          name="composta.analise_qualitativa"
          as="textarea"
          rows="3"
          class="inputtext light mb1"
          :class="{ 'error': errors['composta.analise_qualitativa'] }"
          :disabled="edicaoProibidaAposConferencia"
        />

        <ErrorMessage
          class="error-msg mb1"
          name="composta.analise_qualitativa"
        />
      </div>
    </div>

    <!-- PRA-FAZER: extrair para um componente que receba a lista via props
      e emita os cliques nos botões -->
    <table class="tablemain mb1">
      <thead>
        <tr>
          <th style="width: 30%">
            Documento comprobatório
          </th>
          <th style="width: 60%">
            Descrição
          </th>
          <th style="width: 10%" />
        </tr>
      </thead>
      <tbody>
        <template
          v-for="subitem in dadosExtrasDeComposta.arquivos"
          :key="subitem.id"
        >
          <tr>
            <td>
              <a
                v-if="subitem?.arquivo?.download_token"
                :href="baseUrl + '/download/' + subitem?.arquivo?.download_token"
                download
              >{{ subitem?.arquivo?.nome_original ?? '-' }}</a>
              <template v-else>
                {{ subitem?.arquivo?.nome_original ?? '-' }}
              </template>
            </td>
            <td>
              <a
                v-if="subitem?.arquivo?.download_token"
                :href="baseUrl + '/download/' + subitem?.arquivo?.download_token"
                download
              >{{ subitem?.arquivo?.descricao ?? '-' }}</a>
              <template v-else>
                {{ subitem?.arquivo?.descricao ?? '-' }}
              </template>
            </td>
            <td style="white-space: nowrap; text-align: right;">
              <button
                v-if="subitem.id"
                type="button"
                class="like-a__text tprimary"

                :disabled="edicaoProibidaAposConferencia"

                @click="deleteArquivo(subitem.id)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <button
      v-if="!edicaoProibidaAposConferencia"
      class="like-a__text addlink mb1"
      type="button"
      @click="virtualUpload.open = 1;"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg><span>Adicionar documentos comprobatórios</span>
    </button>

    <h4 class="mb1">
      Valores de variáveis componentes
    </h4>

    <auxiliarDePreenchimento>
      <div class="flex g2 end mb1">
        <div class="f1">
          <label class="label">Valores realizados</label>
          <input
            v-model.number="valorPadraoParaRealizado"
            type="number"
            class="inputtext light mb1"
          >
        </div>
        <div class="f1">
          <label class="label">Valores realizados acumulados</label>
          <input
            v-model.number="valorPadraoParaRealizadoAcumulado"
            type="number"
            class="inputtext light mb1"
          >
        </div>
      </div>

      <div class="flex g2 end mb1">
        <div class="f1">
          <label class="label">Análise qualitativa</label>
          <textarea
            v-model="valorPadraoParaAnaliseQualitativa"
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
          &excl; restaurar
        </button>
        <hr class="f1">
      </div>

      <hr class="mb2 f1">

      <div class="flex mb1">
        <label class="f1">
          <input
            v-model="modoDePreenchimento"
            type="radio"
            class="inputcheckbox"
            value="valor_realizado"
          ><span>Preencher por valor nominal</span></label>
        <label class="f1">
          <input
            v-model="modoDePreenchimento"
            type="radio"
            class="inputcheckbox"
            value="valor_realizado_acumulado"
          ><span>Preencher por valor acumulado</span></label>
      </div>
    </auxiliarDePreenchimento>

    <FieldArray
      v-slot="{ fields }"
      name="linhas"
    >
      <table
        v-if="fields.length"
        class="tablemain no-zebra mb1"
      >
        <thead>
          <tr>
            <th />
            <th>código</th>
            <th>Referência</th>
            <th class="cell--number">
              Valor Realizado
            </th>
            <th class="cell--number">
              Valor Realizado Acumulado
            </th>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <th />
            <th />
            <th />
            <th class="cell--number">
              {{ soma.valor_realizado || '-' }}
            </th>
            <th class="cell--number">
              {{ soma.valor_realizado_acumulado || '-' }}
            </th>
          </tr>
        </tfoot>
        <tbody
          v-for="(field, idx) in fields"
          :key="idx"
        >
          <tr>
            <td class="accordeon">
              <label
                class="center like-a__text"
                aria-label="exibir análise qualitativa"
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
              <strong>{{ field.value.codigo }}</strong> - {{ field.value.titulo }}
            </td>
            <td>
              {{ dateToField(field.value.data_valor) }}
            </td>
            <td class="cell--number">
              <Field
                :name="`linhas[${idx}].valor_realizado`"
                type="number"
                :value="field.value.valor_realizado"
                :step="geradorDeAtributoStep(
                  dadosExtrasPorVariávelId?.[field.value.variavel_id]?.variavel.casas_decimais
                )"
                class="inputtext light"
                :class="{ 'error': errors[`linhas[${idx}].valor_realizado`] }"
                :disabled="modoDePreenchimento !== 'valor_realizado'"
                @update:model-value="() => modoDePreenchimento === 'valor_realizado'
                  ? atualizarOutroValor('valor_realizado_acumulado', field.value.variavel_id, idx)
                  : null"
              />
              <ErrorMessage
                class="error-msg mt1"
                :name="`linhas[${idx}].valor_realizado`"
              />
            </td>
            <td class="cell--number">
              <Field
                v-if="dadosExtrasPorVariávelId[field.value.variavel_id]
                  && dadosExtrasPorVariávelId[field.value.variavel_id]?.acumulativa"
                :name="`linhas[${idx}].valor_realizado_acumulado`"
                type="number"
                :value="field.valor_realizado_acumulado"
                :step="geradorDeAtributoStep(
                  dadosExtrasPorVariávelId?.[field.value.variavel_id]?.variavel.casas_decimais
                )"
                class="inputtext light"
                :class="{ 'error': errors[`linhas[${idx}].valor_realizado_acumulado`] }"
                :disabled="modoDePreenchimento !== 'valor_realizado_acumulado'"
                @update:model-value="() => modoDePreenchimento === 'valor_realizado_acumulado'
                  ? atualizarOutroValor('valor_realizado', field.value.variavel_id, idx)
                  : null"
              />
              <template v-else>
                -
              </template>
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
      </table>
    </FieldArray>

    <FormErrorsList :errors="errors" />

    <p
      v-if="MetaVars.perfil !== 'ponto_focal'"
      class="tc mb1 w700 tamarelo"
    >
      Alterações salvas serão consideradas conferidas por você.
    </p>

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
        v-if="MetaVars.perfil === 'ponto_focal'"
        class="btn big"
        type="button"
        :disabled="isSubmitting || !permitirSubmissaoAoCP"
        @click="submeterAoCP"
      >
        Salvar e submeter
      </button>
      <hr class="ml2 f1">
    </div>
  </form>

  <div
    v-if="virtualUpload.open"
    class="editModal-wrap"
  >
    <div
      class="overlay"
      @click="virtualUpload.open = false"
    />
    <div class="editModal">
      <div>
        <template v-if="virtualUpload?.loading">
          <span class="spinner">Enviando o arquivo</span>
        </template>
        <Form
          v-else
          v-slot="{ errors, isSubmitting }"
          :validation-schema="uploadSchema"
          @submit="addArquivo"
        >
          <div class="flex g2">
            <div class="f1">
              <label class="label">Descrição <span class="tvermelho">*</span></label>
              <Field
                v-model="virtualUpload.descricao"
                name="descricao"
                type="text"
                class="inputtext light mb1"
                :class="{ 'error': errors.descricao }"
              />
              <div class="error-msg">
                {{ errors.descricao }}
              </div>
            </div>
            <div class="f1">
              <label class="label">Tipo de Documento <span class="tvermelho">*</span></label>
              <Field
                v-model="virtualUpload.tipo_documento_id"
                name="tipo_documento_id"
                as="select"
                class="inputtext light mb1"
                :class="{ 'error': errors.tipo_documento_id }"
              >
                <option value="">
                  Selecione
                </option>
                <option
                  v-for="d in tempDocumentTypes"
                  :key="d.id"
                  :value="d.id"
                >
                  {{ d.titulo }}
                </option>
              </Field>
              <div class="error-msg">
                {{ errors.tipo_documento_id }}
              </div>
            </div>
          </div>
          <div class="flex g2 mb2">
            <div class="f1">
              <label class="label">Arquivo</label>

              <label
                v-if="!virtualUpload.name"
                class="addlink"
                :class="{ 'error': errors.arquivo }"
              ><svg
                width="20"
                height="20"
              ><use xlink:href="#i_+" /></svg><span>Selecionar arquivo</span><input
                type="file"
                :onchange="addFile"
                style="display:none;"
              ></label>

              <div v-else-if="virtualUpload.name">
                <span>{{ virtualUpload?.name?.slice(0, 30) }}</span> <a
                  class="addlink"
                  @click="virtualUpload.name = ''"
                ><svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg></a>
              </div>
              <Field
                v-model="virtualUpload.file"
                name="arquivo"
                type="hidden"
              />
              <div class="error-msg">
                {{ errors.arquivo }}
              </div>
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
        </Form>
      </div>
    </div>
  </div>
</template>
