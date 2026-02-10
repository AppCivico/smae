<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
} from 'vee-validate';
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import ModalDeDocumentos from '@/components/arquivos/ModalDeDocumentos.vue';
import AutocompleteField2 from '@/components/AutocompleteField2.vue';
import SmaeText from '@/components/camposDeFormulario/SmaeText/SmaeText.vue';
import MapaCampo from '@/components/geo/MapaCampo.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import SmaeVaralEtapas, { EtapaDoVaral } from '@/components/SmaeVaralEtapas.vue';
import UploadDeArquivosEmLista from '@/components/UploadDeArquivosEmLista/UploadDeArquivosEmLista.vue';
import { CadastroDemanda as schema } from '@/consts/formSchemas/demanda';
import { useAreasTematicasStore } from '@/stores/areasTematicas.store';
import { useDemandasStore } from '@/stores/demandas.store';
import { useOrgansStore } from '@/stores/organs.store';

type EtapaDoVaralComId = EtapaDoVaral & {
  id:
  'Registro' |
  'Validacao' |
  'Publicado' |
  'Encerrado'
};

const router = useRouter();
const organsStore = useOrgansStore();
const demandasStore = useDemandasStore();
const areasTematicasStore = useAreasTematicasStore();

const { organs: listaOrgaos } = storeToRefs(organsStore);
const { lista: listaAreasTematicas } = storeToRefs(areasTematicasStore);
const {
  itemParaEdicao, geolocalizacaoPorToken, erro,
} = storeToRefs(demandasStore);

const todosOsCamposEncaminhamento = computed(() => [
  {
    label: itemParaEdicao.value?.status === 'Registro'
      ? 'Salvar previa' : 'Manter em análise',
    valor: 'editar',
  },
  { label: 'Solicitar ajuste', valor: 'devolver' },
  { label: 'Cancelar demanda', valor: 'cancelar' },
  { label: 'Validar', valor: 'enviar' },
  { label: 'Publicar', valor: 'validar' },
]);

const camposEncaminhamento = computed(() => {
  const permissoes = itemParaEdicao.value?.permissoes;

  return todosOsCamposEncaminhamento.value.filter((campo) => permissoes?.[`pode_${campo.valor}` as keyof typeof permissoes]);
});

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
});

const areaTematicaSelecionada = computed(() => listaAreasTematicas.value
  ?.find((a) => a.id === values.area_tematica_id));

const acoesDaAreaTematica = computed(() => areaTematicaSelecionada.value?.acoes || []);

const labelDoBotaoSubmit = computed(() => {
  const encaminhamento = camposEncaminhamento.value
    .find((c) => c.valor === values.encaminhamento);
  return encaminhamento?.label || 'Salvar';
});

const onSubmit = handleSubmit.withControlled(async ({
  encaminhamento,
  encaminhamento_justificativa: encaminhamentoJustificativa,
  ...dadosEdicao
}) => {
  let r: boolean;

  if (props.demandaId) {
    // dadosEdicao.arquivos = [
    //   {
    //     upload_token: dadosEdicao.upload_tokens[0],
    //     autoriza_divulgacao: true,
    //     descricao: 'desc',
    //   },
    // ];

    r = await demandasStore.atualizarItem({
      acao: encaminhamento,
      demanda_id: props.demandaId,
      edicao: dadosEdicao,
      motivo: encaminhamentoJustificativa,
    });
  } else {
    r = await demandasStore.criarItem(dadosEdicao);
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

const itemsVaralEtapas = computed<EtapaDoVaralComId[]>(() => {
  const etapas: EtapaDoVaralComId[] = [
    {
      id: 'Registro', responsavel: 'Gestor Municipal', nome: 'Registro', observacao: null, status: 'pendente', atual: true,
    },
    {
      id: 'Validacao', responsavel: 'SERI', nome: 'Validação', observacao: null, status: 'pendente', atual: false,
    },
    {
      id: 'Publicado', responsavel: 'SERI', nome: 'Publicada', observacao: null, status: 'pendente', atual: false,
    },
    {
      id: 'Encerrado', responsavel: 'SERI', nome: 'Encerrada', observacao: itemParaEdicao.value.situacao_encerramento || null, status: 'pendente', atual: false,
    },
  ];

  const statusAtual = itemParaEdicao.value?.status;

  const indiceAtual = etapas.findIndex((e) => e.id === statusAtual);

  if (indiceAtual === -1) return etapas;

  return etapas.map((etapa, i) => {
    let status: EtapaDoVaral['status'] = 'pendente';

    if (i < indiceAtual) {
      status = 'concluida';
    } else if (i === indiceAtual && etapa.id === 'Encerrado') {
      if (itemParaEdicao.value.situacao_encerramento === 'Cancelada') {
        status = 'encerrada-cancelada';
      } else {
        status = 'encerrada-atendida';
      }
    }

    const tempoNaEtapa = itemParaEdicao.value?.[`dias_em_${etapa.id.toLowerCase()}`];

    return {
      ...etapa,
      atual: i === indiceAtual,
      observacao: etapa.observacao || (tempoNaEtapa && `${tempoNaEtapa} dias`) || null,
      status,
    };
  });
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
      values: novosValores,
    });
  }
}, { immediate: true });
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
          {{ item.observacao }}
        </h6>
      </div>
    </template>
  </SmaeVaralEtapas>

  <form
    class="flex column g2"
    @submit.prevent="onSubmit"
  >
    <Field
      name="id"
      hidden
    />

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
            <option value="">
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
              unique
              :model-value="value"
              :controlador="{
                busca: '',
                participantes: value ? [value] : []
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
          <!-- <UploadDeArquivosEmLista
            tipo="DOCUMENTO"
            :arquivos-existentes="value"
            @update:model-value="ev => setFieldValue('upload_tokens', ev)"
            @arquivo-existente-removido="removerArquivo"
          /> -->
          <ModalDeDocumentos :model-value="value" />
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
          @change="setFieldValue('acao_ids', [])"
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

        <Field
          v-slot="{ handleChange, value }"
          name="acao_ids"
          :class="{ error: errors.acao_ids }"
        >
          <AutocompleteField2
            :model-value="value"
            :controlador="{
              busca: '',
              participantes: value || []
            }"
            label="nome"
            :grupo="acoesDaAreaTematica"
            @change="handleChange"
          />
        </Field>

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

    <fieldset
      v-if="$props.demandaId"
      class="sessao-encaminhamento"
      aria-labelledby="titulo-encaminhamento"
    >
      <h3 id="titulo-encaminhamento">
        Encaminhamento da demanda
      </h3>

      <div>
        <div class="flex flexwrap g2 start pt05 pb05">
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
            {{ campoEncaminhamento.label }}
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
