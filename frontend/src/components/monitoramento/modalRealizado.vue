<script setup>
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useCiclosStore } from '@/stores/ciclos.store';
import { useDocumentTypesStore } from '@/stores/documentTypes.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { storeToRefs } from 'pinia';
import { Field, Form, useForm } from 'vee-validate';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import * as Yup from 'yup';
import { arquivoSimples as uploadSchema } from '@/consts/formSchemas';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const { meta_id } = route.params;

const pr = defineProps(['props']);
const { props } = pr;

const CiclosStore = useCiclosStore();
const { SingleAnalise } = storeToRefs(CiclosStore);

async function getAnaliseData() {
  await CiclosStore.getAnalise(props.var_id, props.periodo);
  const x = SingleAnalise.value;
  SingleAnalise.value.valor_realizado = x.series[x.ordem_series.indexOf('Realizado')]?.valor_nominal;
  SingleAnalise.value.valor_realizado_acumulado = x.series[x.ordem_series.indexOf('RealizadoAcumulado')]?.valor_nominal;
  SingleAnalise.value.analise_qualitativa = x.analises[0]?.analise_qualitativa;
}
getAnaliseData();

const documentTypesStore = useDocumentTypesStore();
const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const schema = Yup.object().shape({
  valor_realizado: Yup.string(),
  valor_realizado_acumulado: Yup.string().nullable(),
  analise_qualitativa: Yup.string(),
});

const {
  errors, isSubmitting, setFieldValue, handleSubmit,
} = useForm({
  initialValues: SingleAnalise,
  validationSchema: schema,
});

const submitBt = ref({});
const enviaCP = ref(false);
const isLoadingData = ref(true);

function formatarValorRealizado(valor) {
  let valorTexto = valor;

  if (typeof valor === 'number') {
    valorTexto = valor.toString();
  }

  const valorComPonto = valorTexto.replace(',', '.');
  const valorFormatado = Number(valorComPonto);

  if (Number.isNaN(valorFormatado)) {
    return '';
  }

  return valorFormatado.toString();
}

const onSubmit = handleSubmit(async (values) => {
  try {
    let msg;
    let r;

    const v = {
      variavel_id: props.var_id,
      data_valor: props.periodo,
      valor_realizado: formatarValorRealizado(values.valor_realizado),
      valor_realizado_acumulado: formatarValorRealizado(values.valor_realizado_acumulado),
      analise_qualitativa: values.analise_qualitativa,
      enviar_para_cp: enviaCP.value,
    };

    r = await CiclosStore.updateAnalise(v);
    msg = 'Dados salvos com sucesso!';
    enviaCP.value = false;
    if (r == true) {
      editModalStore.clear();
      alertStore.success(msg);
      CiclosStore.getMetaVars(meta_id);
    }
  } catch (error) {
    enviaCP.value = false;
    alertStore.error(error);
  }
});

function submeter(e) {
  const item = e.target;
  alertStore.confirmAction(
    'Deseja submeter as informações? Após o envio, os dados só poderão ser editados pela coordenadoria de planejamento ou em caso de solicitação de complementação.',
    () => { enviaCP.value = true; submitBt.value.click(); alertStore.clear(); },
    'Enviar',
  );
}
function dateToTitle(d) {
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const month = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][dd.getUTCMonth()];
  const year = dd.getUTCFullYear();
  return `${month} ${year}`;
}
function dateToDate(d) {
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const dx = (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }) : '';
  return dx || '';
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
      r = await CiclosStore.addArquivo({
        data_valor: props.periodo,
        variavel_id: props.var_id,
        upload_token: u.upload_token,
      }, values);
      if (r === true) {
        msg = 'Item adicionado com sucesso!';
        alertStore.success(msg);
        virtualUpload.value = {};
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
  alertStore.confirmAction('Deseja remover o arquivo?', () => {
    CiclosStore.deleteArquivo(id);
  }, 'Remover');
}
function addFile(e) {
  const { files } = e.target;
  virtualUpload.value.name = files[0].name;
  virtualUpload.value.file = files[0];
}

function handleChangeValorRealizado(value) {
  if (isLoadingData.value) {
    isLoadingData.value = false;

    return;
  }

  const valorRealizado = Number(value);
  const valorRealizadoAtual = Number(SingleAnalise.value.valor_realizado);
  const valorRealizadoAcumulado = Number(SingleAnalise.value.valor_realizado_acumulado);

  if (Number.isNaN(valorRealizado) || Number.isNaN(valorRealizadoAcumulado)) {
    const err = new Error();
    console.error(
      'Erro ao tentar atribuir valor para variavel acumulado.',
      {
        valorRealizado,
        valorRealizadoAcumulado,
      },
      err.stack,
    );
    return;
  }

  setFieldValue('valor_realizado_acumulado', (valorRealizado - valorRealizadoAtual) + valorRealizadoAcumulado);
}

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>Adicionar valor realizado</h2>
    <hr class="ml2 f1">
    <span>
      <button
        class="btn round ml2"
        @click="props.checkClose"
      ><svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg></button>
    </span>
  </div>

  <template v-if="SingleAnalise?.variavel">
    <div class="label tamarelo mb1">
      {{ props.parent.atividade
        ? `Indicador da atividade ${props.parent.atividade.codigo} ${props.parent.atividade.titulo}`
        : props.parent.iniciativa
          ? `Indicador da iniciativa ${props.parent.iniciativa.codigo} ${props.parent.iniciativa.titulo}`
          : 'Indicador da Meta'
      }}
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

    <div class="t20">
      <strong>{{ SingleAnalise.variavel.codigo }} {{ SingleAnalise.variavel.titulo }}</strong>
    </div>
    <div class="t20 mb2">
      {{ dateToTitle(props.periodo) }}
    </div>

    <template
      v-if="SingleAnalise.ultimoPedidoComplementacao
        && !SingleAnalise.ultimoPedidoComplementacao.atendido"
    >
      <div class="complementacao mb2">
        <div class="w700 t13 mb1">
          Solicitação de complementação
        </div>
        <p>{{ SingleAnalise.ultimoPedidoComplementacao.pedido }}</p>
        <div class="t12 tc600">
          {{ dateToDate(SingleAnalise.ultimoPedidoComplementacao.criado_em) }},
          {{ SingleAnalise.ultimoPedidoComplementacao.criador.nome_exibicao }}
        </div>
      </div>
    </template>

    <div class="flex g2">
      <div>
        <div class="t12 uc w700 tc200">
          Unidade de medida
        </div>
        <div class="t13">
          {{ SingleAnalise.variavel.unidade_medida.sigla }}
          ({{ SingleAnalise.variavel.unidade_medida.descricao }})
        </div>
      </div>
      <div>
        <div class="t12 uc w700 tc200">
          Número de casas decimais
        </div>
        <div class="t13">
          {{ SingleAnalise.variavel.casas_decimais }}
        </div>
      </div>
      <div>
        <div class="t12 uc w700 tc200">
          Projetado
        </div>
        <div class="t13">
          {{ SingleAnalise.series[SingleAnalise.ordem_series.indexOf('Previsto')].valor_nominal
            ?? '-' }}
        </div>
      </div>
    </div>

    <hr class="mt2 mb2">

    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
    >
      <div class="flex g2">
        <div class="f1">
          <label class="label">Valor Realizado</label>
          <Field
            name="valor_realizado"
            type="number"
            :step="'0' + (SingleAnalise.variavel.casas_decimais
              ? '.' + ('0'.repeat(SingleAnalise.variavel.casas_decimais - 1)) + '1'
              : '')
            "
            class="inputtext light mb1"
            :class="{ 'error': errors.valor_realizado }"
            @update:model-value="handleChangeValorRealizado"
          />
          <div class="error-msg mb1">
            {{ errors.valor_realizado }}
          </div>

          <template v-if="SingleAnalise.variavel.acumulativa">
            <label class="label">Valor Realizado Acumulado</label>
            <Field
              name="valor_realizado_acumulado"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.valor_realizado_acumulado }"
              disabled
            />
            <div class="error-msg mb1">
              {{ errors.valor_realizado_acumulado }}
            </div>
          </template>
        </div>
        <div class="f1">
          <label class="label">Análise qualitativa</label>
          <Field
            name="analise_qualitativa"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ 'error': errors.analise_qualitativa }"
          />
          <div class="error-msg">
            {{ errors.analise_qualitativa }}
          </div>
        </div>
      </div>
      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          ref="submitBt"
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
          @click="submeter"
        >
          Salvar e submeter
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>

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
          v-for="subitem in SingleAnalise.arquivos"
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
    <a
      class="addlink mb1"
      @click="virtualUpload.open=1;"
    ><svg
      width="20"
      height="20"
    ><use xlink:href="#i_+" /></svg> <span>Adicionar documentos comprobatórios</span></a>

    <div
      v-if="virtualUpload.open"
      class="editModal-wrap"
    >
      <div
        class="overlay"
        @click="virtualUpload.open=false"
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
                  <span>{{ virtualUpload?.name?.slice(0,30) }}</span> <a
                    class="addlink"
                    @click="virtualUpload.name=''"
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
  <template v-if="SingleAnalise?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="SingleAnalise?.error||error">
    <div class="error p1">
      <div class="error-msg">
        {{ SingleAnalise.error??error }}
      </div>
    </div>
  </template>
</template>
