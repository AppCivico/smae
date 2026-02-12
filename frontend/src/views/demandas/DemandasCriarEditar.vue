<script lang="ts" setup>
import { vMaska } from 'maska';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
} from 'vee-validate';
import {
  computed, onMounted, watch,
} from 'vue';
import { useRouter } from 'vue-router';

import ModalDeDocumentos from '@/components/arquivos/ModalDeDocumentos/ModalDeDocumentos.vue';
import AutocompleteField2 from '@/components/AutocompleteField2.vue';
import SmaeText from '@/components/camposDeFormulario/SmaeText/SmaeText.vue';
import MapaCampo from '@/components/geo/MapaCampo.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import SmaeVaralEtapas, { EtapaDoVaral } from '@/components/SmaeVaralEtapas.vue';
import { CadastroDemandaSchema } from '@/consts/formSchemas/demanda';
import dinheiro from '@/helpers/dinheiro';
import { useAreasTematicasStore } from '@/stores/areasTematicas.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDemandasStore } from '@/stores/demandas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useValoresLimitesStore } from '@/stores/valoresLimites.store';

import MapaStatus, { StatusDemanda } from './MapaStatus';

type EtapaDoVaralComId = EtapaDoVaral & {
  id: StatusDemanda;
};

const router = useRouter();
const organsStore = useOrgansStore();
const demandasStore = useDemandasStore();
const areasTematicasStore = useAreasTematicasStore();
const valoresLimitesStore = useValoresLimitesStore();
const authStore = useAuthStore();

const { orgaosComNome: listaOrgaos } = storeToRefs(organsStore);
const { lista: listaAreasTematicas } = storeToRefs(areasTematicasStore);
const { ativo: valoresLimitesAtivo } = storeToRefs(valoresLimitesStore);
const {
  itemParaEdicao, geolocalizacaoPorToken, erro,
} = storeToRefs(demandasStore);

const schema = computed(() => (
  CadastroDemandaSchema({
    valorMinimo: valoresLimitesAtivo.value?.valor_minimo,
  })
));

const todosOsCamposEncaminhamento = computed(() => [
  {
    label: itemParaEdicao.value?.status === 'Registro'
      ? 'Salvar previa' : 'Manter em análise',
    valor: 'editar',
  },
  { label: 'Solicitar ajuste', valor: 'devolver' },
  { label: 'Encaminhar para validação', valor: 'enviar' },
  { label: 'Publicar', valor: 'validar' },
  { label: 'Cancelar demanda', valor: 'cancelar' },
]);

const camposEncaminhamento = computed(() => {
  const permissoes = itemParaEdicao.value?.permissoes;

  return todosOsCamposEncaminhamento.value.filter((campo) => permissoes?.[`pode_${campo.valor}` as keyof typeof permissoes]);
});

const bloquearCampos = computed(() => {
  if (!itemParaEdicao.value?.id) {
    return false;
  }

  return camposEncaminhamento.value.length === 0;
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

const listaAreasTematicasFiltradas = computed(() => {
  if (props.demandaId) {
    return listaAreasTematicas.value;
  }

  return listaAreasTematicas.value.filter((item) => item.ativo);
});

const acoesDaAreaTematica = computed(() => {
  const areaTematicaSelecionada = listaAreasTematicas.value
    ?.find((a) => a.id === values.area_tematica_id);

  if (!areaTematicaSelecionada) {
    return [];
  }

  if (props.demandaId) {
    return areaTematicaSelecionada.acoes.map((item) => {
      let { nome } = item;

      if (!item.ativo) {
        nome = `(INATIVO) - ${item.nome}`;
      }

      return {
        ...item,
        nome,
      };
    });
  }

  return areaTematicaSelecionada.acoes.filter((item) => item.ativo);
});

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

const itemsVaralEtapas = computed<EtapaDoVaralComId[]>(() => {
  const etapas: EtapaDoVaralComId[] = [
    {
      id: 'Registro', responsavel: 'Gestor Municipal', nome: MapaStatus.Registro, observacao: null, status: 'pendente', atual: true,
    },
    {
      id: 'Validacao', responsavel: 'SERI', nome: MapaStatus.Validacao, observacao: null, status: 'pendente', atual: false,
    },
    {
      id: 'Publicado', responsavel: 'SERI', nome: MapaStatus.Publicado, observacao: null, status: 'pendente', atual: false,
    },
    {
      id: 'Encerrado', responsavel: 'SERI', nome: MapaStatus.Encerrado, observacao: itemParaEdicao.value.situacao_encerramento || null, status: 'pendente', atual: false,
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
  Promise.all([
    areasTematicasStore.buscarTudo(),
    organsStore.getAll(),
    valoresLimitesStore.buscarAtivo(),
  ]).then();

  if (props.demandaId) {
    demandasStore.buscarItem(props.demandaId);
    return;
  }

  resetForm({
    values: {
      localizacoes: [],
      orgao_id: authStore.user.orgao_id,
    },
  });
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
              :disabled="bloquearCampos"
              :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
          >
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

      <div
        v-if="
          valoresLimitesAtivo
            && valoresLimitesAtivo.valor_maximo != null
            && parseFloat(values.valor) > parseFloat(valoresLimitesAtivo.valor_maximo)
        "
        class="barra-limite mt1"
      >
        Valor acima de
        {{ dinheiro(valoresLimitesAtivo.valor_maximo, { style: 'currency' }) }}
        tem menor chance de ser atendido
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
              label="nome_completo"
              :grupo="listaOrgaos || []"
              :numero-maximo-de-participantes="1"
              :readonly="bloquearCampos"
              :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
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
            v-maska
            name="telefone_responsavel"
            class="inputtext light mb1"
            :class="{ error: errors.telefone_responsavel }"
            type="text"
            maxlength="15"
            data-maska="(##) #####-####'"
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
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
          :disabled="bloquearCampos"
          :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
            @update:model="handleChange"
          />
        </Field>

        <ErrorMessage
          name="localizacoes"
          class="error-msg"
        />
      </div>

      <div>
        <SmaeLabel
          name="arquivos"
          :schema="schema"
        />

        <Field
          v-slot="{value, handleChange}"
          name="arquivos"
        >
          <ModalDeDocumentos
            :model-value="value"
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="arquivos"
          class="error-msg"
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
          :disabled="bloquearCampos"
          :aria-disabled="bloquearCampos"
          @change="setFieldValue('acao_ids', [])"
        >
          <option
            v-for="area in listaAreasTematicasFiltradas"
            :key="area.id"
            :value="area.id"
            :disabled="!area.ativo"
            :aria-disabled="!area.ativo"
          >
            {{ area.nome }}
          </option>
        </Field>

        <ErrorMessage
          name="area_tematica_id"
          class="error-msg"
        />
      </div>

      <div class="mb1">
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
            :readonly="bloquearCampos"
            :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
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
      v-if="$props.demandaId && camposEncaminhamento.length"
      class="sessao-encaminhamento"
      aria-labelledby="titulo-encaminhamento"
    >
      <h3 id="titulo-encaminhamento">
        Encaminhamento da demanda
      </h3>

      <div>
        <div
          v-if="camposEncaminhamento.length"
          class="flex flexwrap g2 start pt05 pb05"
        >
          <label
            v-for="campoEncaminhamento in camposEncaminhamento"
            :key="`encaminhamento--${campoEncaminhamento.valor}`"
            class="flex g05 center"
          >
            <Field
              name="encaminhamento"
              type="radio"
              :value="campoEncaminhamento.valor"
              :disabled="bloquearCampos"
              :aria-disabled="bloquearCampos"
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
            :disabled="bloquearCampos"
            :aria-disabled="bloquearCampos"
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

    <SmaeFieldsetSubmit remover-linhas-decoracao>
      <button
        class="btn big"
        type="submit"
        :disabled="bloquearCampos"
        :aria-disabled="bloquearCampos"
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

.barra-limite {
  background-color: @amarelo;
  text-align: center;
  width: 100%;
  padding: 10px;
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
