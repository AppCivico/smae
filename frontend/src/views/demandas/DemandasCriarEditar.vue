<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
} from 'vee-validate';
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import AutocompleteField2 from '@/components/AutocompleteField2.vue';
import SmaeText from '@/components/camposDeFormulario/SmaeText/SmaeText.vue';
import MapaCampo from '@/components/geo/MapaCampo.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import SmaeVaralEtapas, { EtapaDoVaral } from '@/components/SmaeVaralEtapas.vue';
import UploadDeArquivosEmLista from '@/components/UploadDeArquivosEmLista/UploadDeArquivosEmLista.vue';
import { CadastroDemanda as schema } from '@/consts/formSchemas/demanda';
import { useAlertStore } from '@/stores/alert.store';
import { useAreasTematicasStore } from '@/stores/areasTematicas.store';
import { useDemandasStore } from '@/stores/demandas.store';
import { useOrgansStore } from '@/stores/organs.store';

type EtapaDoVaralComId = EtapaDoVaral & {
  id:
  'Registro' |
  'Validacao' |
  'Publicacao' |
  'Encerramento'
};

const camposEncaminhamento = [
  { label: 'Manter em análise', valor: 'editar' },
  { label: 'Solicitar ajuste', valor: 'devolver' },
  { label: 'Cancelar demanda', valor: 'cancelar' },
  { label: 'Publicar demanda', valor: 'enviar' },
  { label: 'Validar?', valor: 'validar' },
];

const router = useRouter();
const alertStore = useAlertStore();
const organsStore = useOrgansStore();
const demandasStore = useDemandasStore();
const areasTematicasStore = useAreasTematicasStore();

const { organs: listaOrgaos } = storeToRefs(organsStore);
const { lista: listaAreasTematicas } = storeToRefs(areasTematicasStore);
const {
  itemParaEdicao, geolocalizacaoPorToken, erro,
} = storeToRefs(demandasStore);

const props = defineProps({
  demandaId: {
    type: Number,
    default: 0,
  },
});

const {
  errors,
  handleSubmit,
  resetForm,
  values,
  setFieldValue,
} = useForm({
  validationSchema: schema,
  initialValues: itemParaEdicao.value,
});

const areaTematicaSelecionada = computed(() => listaAreasTematicas.value
  ?.find((a) => a.id === values.area_tematica_id));

const acoesDaAreaTematica = computed(() => areaTematicaSelecionada.value?.acoes || []);

const labelDoBotaoSubmit = computed(() => {
  const encaminhamento = camposEncaminhamento
    .find((c) => c.valor === values.encaminhamento);
  return encaminhamento?.label || 'Salvar';
});

const onSubmit = handleSubmit(async (carga) => {
  const orgaoId = carga.orgao_id[0];
  const dadosEdicao = {
    ...carga,
    orgao_id: orgaoId,
  };

  let r: boolean;

  if (props.demandaId) {
    r = await demandasStore.atualizarItem({
      acao: carga.encaminhamento,
      demanda_id: props.demandaId,
      edicao: dadosEdicao,
      motivo: carga.encaminhamento_justificativa,
    });
  } else {
    r = await demandasStore.salvarItem(dadosEdicao, props.demandaId);
  }

  if (r) {
    demandasStore.$reset();
    router.push({ name: 'demandas.listar' });
  }
});

function removerArquivo(idx) {
  const arquivos = [...(values.arquivos || [])];
  arquivos.splice(idx, 1);
  setFieldValue('arquivos', arquivos);
}

function toggleAcao(acaoId) {
  const acaoIds = [...(values.acao_ids || [])];
  const index = acaoIds.indexOf(acaoId);
  if (index === -1) {
    acaoIds.push(acaoId);
  } else {
    acaoIds.splice(index, 1);
  }
  setFieldValue('acao_ids', acaoIds);
}

const itemsVaralEtapas = computed<EtapaDoVaralComId[]>(() => {
  const etapas: EtapaDoVaralComId[] = [
    {
      id: 'Registro', responsavel: 'Gestor Municipal', nome: 'Registro', duracao: '1 dia', status: 'pendente', atual: true,
    },
    {
      id: 'Validacao', responsavel: 'SERI', nome: 'Validação', duracao: '12 dias', status: 'pendente', atual: false,
    },
    {
      id: 'Publicacao', responsavel: 'SERI', nome: 'Publicada', duracao: '6 dias', status: 'pendente', atual: false,
    },
    {
      id: 'Encerramento', responsavel: 'SERI', nome: 'Encerrada', duracao: 'Atendida', status: 'encerrada-atendida', atual: false,
    },
  ];

  switch (itemParaEdicao.value.status) {
    case 'Registro':
      return etapas.map<EtapaDoVaral>((item) => ({
        ...item,
        status: item.id === 'Registro' ? 'pendente' : 'pendente',
        atual: item.id === 'Registro',
      }));

    case 'Encerrado':
      return etapas.map<EtapaDoVaral>((item) => ({
        ...item,
        status: item.id === 'Encerramento' ? 'encerrada-atendida' : 'concluida',
        atual: item.id === 'Encerramento',
      }));

    default:
      return etapas;
  }
});

onMounted(() => {
  if (props.demandaId) {
    demandasStore.buscarItem(props.demandaId);
  }

  Promise.all([
    areasTematicasStore.buscarTudo(),
    organsStore.getAll(),
  ]).then();
});

watch(itemParaEdicao, (novosValores) => {
  if (novosValores) {
    resetForm({
      values: {
        ...novosValores,
        orgao_id: [novosValores.orgao.id],
      },
    });
  }
});

watch(() => values.area_tematica_id, () => {
  setFieldValue('acao_ids', []);
});
</script>

<template>
  <CabecalhoDePagina />

  <SmaeVaralEtapas
    class="mb2"
    desativar-navegacao
    :etapas="itemsVaralEtapas"
  >
    <template #default="{ item }">
      <div class="flex column g025 tl">
        <h6 class="etapas-item t14">
          {{ item.responsavel }}
        </h6>

        <h5 class="etapas-item etapas-item--principal t18">
          {{ item.nome }}
        </h5>

        <h6 class="etapas-item t12">
          {{ item.duracao }}
        </h6>
      </div>
    </template>
  </SmaeVaralEtapas>

  <form
    class="flex column g2"
    @submit.prevent="onSubmit"
  >
    <!-- Recurso Financeiro -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Recurso Financeiro
      </legend>

      <div class="flex g2 flexwrap">
        <div class="f1 fb30">
          <SmaeLabel
            name="valor"
            :schema="schema"
          />

          <Field
            v-slot="{ field, handleChange, value }"
            name="valor"
          >
            <MaskedFloatInput
              class="inputtext light"
              :class="{ error: errors.valor }"
              :value="value"
              :name="field.name"
              converter-para="string"
              @update:model-value="handleChange"
            />
          </Field>
          <ErrorMessage
            name="valor"
            class="error-msg"
          />
        </div>

        <div class="f1 fb30">
          <SmaeLabel
            name="finalidade"
            :schema="schema"
          />

          <Field
            name="finalidade"
            as="select"
            class="inputtext light"
            :class="{ error: errors.finalidade }"
          >
            <option :value="null">
              Selecionar
            </option>

            <option
              v-for="finalidade in ['Custeio', 'Investimento']"
              :key="`demanda-finalidade--${finalidade}`"
              :value="finalidade"
            >
              {{ finalidade }}
            </option>
          </Field>

          <ErrorMessage
            name="finalidade"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <!-- Contato do Proponente -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Contato do Proponente
      </legend>

      <div class="flex g2 flexwrap mb1">
        <div class="f1 fb40">
          <SmaeLabel
            name="orgao_id"
            :schema="schema"
          />

          <Field
            v-slot="{ handleChange, value }"
            name="orgao_id"
            :class="{ error: errors.orgao_id }"
          >
            <AutocompleteField2
              :model-value="value"
              :controlador="{
                busca: '',
                participantes: value || []
              }"
              label="sigla"
              :grupo="listaOrgaos || []"
              :numero-maximo-de-participantes="1"
              @change="handleChange"
            />
          </Field>

          <ErrorMessage
            name="orgao_id"
            class="error-msg"
          />
        </div>

        <div class="f1 fb40">
          <SmaeLabel
            name="unidade_responsavel"
            :schema="schema"
          />

          <Field
            name="unidade_responsavel"
            type="text"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.unidade_responsavel }"
          />

          <ErrorMessage
            name="unidade_responsavel"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2 flexwrap mb1">
        <div class="f1 fb40">
          <SmaeLabel
            name="nome_responsavel"
            :schema="schema"
          />

          <Field
            name="nome_responsavel"
            type="text"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.nome_responsavel }"
          />

          <ErrorMessage
            name="nome_responsavel"
            class="error-msg"
          />
        </div>

        <div class="f1 fb40">
          <SmaeLabel
            name="cargo_responsavel"
            :schema="schema"
          />

          <Field
            name="cargo_responsavel"
            type="text"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.cargo_responsavel }"
          />

          <ErrorMessage
            name="cargo_responsavel"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2 flexwrap">
        <div class="f1 fb40">
          <SmaeLabel
            name="email_responsavel"
            :schema="schema"
          />

          <Field
            name="email_responsavel"
            type="email"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.email_responsavel }"
          />

          <ErrorMessage
            name="email_responsavel"
            class="error-msg"
          />
        </div>

        <div class="f1 fb40">
          <SmaeLabel
            name="telefone_responsavel"
            :schema="schema"
          />

          <Field
            name="telefone_responsavel"
            type="tel"
            class="inputtext light"
            maxlength="20"
            :class="{ error: errors.telefone_responsavel }"
          />

          <ErrorMessage
            name="telefone_responsavel"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <!-- Demanda -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Demanda
      </legend>

      <div class="mb1">
        <SmaeLabel
          name="nome_projeto"
          :schema="schema"
        />

        <Field
          name="nome_projeto"
          type="text"
          class="inputtext light"
          maxlength="250"
          :class="{ error: errors.nome_projeto }"
        />

        <ErrorMessage
          name="nome_projeto"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="descricao"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="descricao"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="justificativa"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="justificativa"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="justificativa"
          class="error-msg"
        />
      </div>

      <div class="mb2">
        <SmaeLabel
          name="localizacoes"
          :schema="schema"
        />

        <Field
          v-slot="{ value, handleChange, field }"
          name="localizacoes"
        >
          <pre class="debug">value: {{ value }}</pre>
          <MapaCampo
            :name="field.name"
            :model-value="value"
            :geolocalização-por-token="geolocalizacaoPorToken"
            @update:model="handleChange"
          />
        </Field>
      </div>

      <div>
        <SmaeLabel
          name="arquivos"
          :schema="schema"
        />

        <Field
          v-slot="{value}"
          name="arquivos"
        >
          <UploadDeArquivosEmLista
            tipo="DOCUMENTO"
            :arquivos-existentes="value"
            @update:model-value="ev => setFieldValue('upload_tokens', ev)"
            @arquivo-existente-removido="removerArquivo"
          />
        </Field>

        <Field
          name="upload_tokens"
          type="hidden"
        />
      </div>
    </fieldset>

    <!-- Área Temática -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Área Temática
      </legend>

      <div class="mb1">
        <SmaeLabel
          name="area_tematica_id"
          :schema="schema"
        />

        <Field
          name="area_tematica_id"
          as="select"
          class="inputtext light"
          :class="{ error: errors.area_tematica_id }"
        >
          <option :value="null">
            Selecionar
          </option>

          <option
            v-for="area in listaAreasTematicas"
            :key="area.id"
            :value="area.id"
          >
            {{ area.nome }}
          </option>
        </Field>

        <ErrorMessage
          name="area_tematica_id"
          class="error-msg"
        />
      </div>

      <div
        v-if="acoesDaAreaTematica.length"
        class="mb1"
      >
        <SmaeLabel
          name="acao_ids"
          :schema="schema"
        />

        <div class="flex column g05 start">
          <label
            v-for="acao in acoesDaAreaTematica"
            :key="acao.id"
            class="flex g1 center"
          >
            <input
              type="checkbox"
              :checked="values.acao_ids?.includes(acao.id)"
              @change="toggleAcao(acao.id)"
            >
            <span>{{ acao.nome }}</span>
          </label>
        </div>

        <ErrorMessage
          name="acao_ids"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="observacao"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="observacao"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="observacao"
          class="error-msg"
        />
      </div>
    </fieldset>

    {{ values.encaminhamento }}
    <fieldset
      v-if="$props.demandaId"
      class="sessao-encaminhamento"
    >
      <h3>Encaminhamento da demanda</h3>

      <div>
        <div class="flex g2 start pt05 pb05">
          <label
            v-for="campoEncaminhamento in camposEncaminhamento"
            :key="`encaminhamento--${campoEncaminhamento.valor}`"
            class="flex g05 center"
          >
            <Field
              name="encaminhamento"
              type="radio"
              :value="campoEncaminhamento.valor"
              @update:model-value="setFieldValue('encaminhamento_justificativa', null)"
            />
            <span>{{ campoEncaminhamento.label }}</span>
          </label>
        </div>

        <ErrorMessage
          name="encaminhamento"
          class="error-msg"
        />
      </div>

      <div
        v-if="['devolver', 'cancelar'].includes(values.encaminhamento)"
        class="mt1"
      >
        <SmaeLabel
          name="encaminhamento_justificativa"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="encaminhamento_justificativa"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="encaminhamento_justificativa"
          class="error-msg"
        />
      </div>
    </fieldset>

    <SmaeFieldsetSubmit>
      <button
        class="btn big"
        type="submit"
      >
        {{ labelDoBotaoSubmit }}
      </button>
    </SmaeFieldsetSubmit>
  </form>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.etapas-item {
  margin: 0;
  color: @cinza-medio;
  font-weight: 300;

  &--principal {
    font-weight: 600;
    color: #333333;
  }
}

fieldset {
  border-top: 1.5px solid @c300;
}

fieldset legend {
  color: @c300;
  font-weight: 400;
  font-size: 20px;
  line-height: 130%;
}

.sessao-encaminhamento {
  border-top: 4px solid #F7C234;
  padding: 16px;

  h3 {
    font-weight: 700;
    font-style: Bold;
    font-size: 1rem;
    line-height: 130%;
  }
}
</style>
