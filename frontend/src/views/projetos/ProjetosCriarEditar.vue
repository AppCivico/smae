<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CheckClose from '@/components/CheckClose.vue';
import {
  useAlertStore, useOrgansStore, usePortfolioStore, useProjetosStore
} from '@/stores';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const OrgansStore = useOrgansStore();
const alertStore = useAlertStore();
const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const {
  chamadasPendentes, emFoco, erro, pdmsSimplificados, pdmsPorId, metaSimplificada,
} = storeToRefs(projetosStore);
const ÓrgãosStore = useOrgansStore();
const { órgãosQueTemResponsáveis, órgãosQueTemResponsáveisEPorId } = storeToRefs(ÓrgãosStore);

const router = useRouter();
const route = useRoute();

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

const portfolioId = Number.parseInt(route.query.portfolio_id, 10) || undefined;

const itemParaEdição = computed(() => (props?.projetoId
  ? {
    ...emFoco.value,
    id: undefined,
  }
  : {
    meta_codigo: '',
    origem_outro: '',
    data_aprovacao: null,
    data_revisao: null,
    escopo: '',
    portfolio_id: portfolioId,
    previsao_custo: null,
    principais_etapas: '',
    resumo: '',
  }));

const órgãosDisponíveisNessePortfolio = ((idDoPortfólio) => portfolioStore
  .portfoliosPorId?.[idDoPortfólio]?.orgaos
  .filter((x) => órgãosQueTemResponsáveisEPorId.value?.[x.id]?.responsible?.length) || []);

const iniciativasPorId = computed(() => (Array.isArray(metaSimplificada.value?.iniciativas)
  ? metaSimplificada.value.iniciativas.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {})
  : {}));

const possíveisOrigens = [
  {
    texto: 'Plano de Metas',
    valor: 'PdmSistema',
  },
  {
    texto: 'Outro programa de metas',
    valor: 'PdmAntigo',
  },
  {
    texto: 'Outro',
    valor: 'Outro',
  },
];

async function buscarDadosParaOrigens(e) {
  switch (e.target?.value) {
    case 'PdmSistema':
      if (!pdmsSimplificados.value.length) {
        await projetosStore.buscarPdms();
      }
      break;

    default:
      break;
  }
}

async function buscarMetaSimplificada(e) {
  const idDaMeta = e.target?.value;

  if (idDaMeta) {
    await projetosStore.buscarMetaSimplificada({ meta_ids: idDaMeta });
  }
}

async function onSubmit(valores) {
  const carga = valores;

  switch (true) {
    case !!carga.atividade_id:
      carga.iniciativa_id = undefined;
      carga.meta_id = undefined;
      break;

    case !!carga.iniciativa_id:
      carga.meta_id = undefined;
      carga.atividade_id = undefined;
      break;

    case !!carga.meta_id:
      carga.atividade_id = undefined;
      carga.iniciativa_id = undefined;
      break;

    default:
      break;
  }

  if (carga.pdm_escolhido) {
    carga.pdm_escolhido = undefined;
  }

  try {
    const msg = props.projetoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.projetoId
      ? await projetosStore.salvarItem(carga, props.projetoId)
      : await projetosStore.salvarItem(carga);

    if (resposta) {
      const rotaApósSalvamento = props.projetoId
        ? { name: 'projetosListar' }
        : {
          name: 'projetosEditar',
          params: { projetoId: resposta.id },
        };

      alertStore.success(msg);
      await router.push(rotaApósSalvamento);
      projetosStore.$reset();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function iniciar() {
  projetosStore.$reset();

  if (props.projetoId) {
    projetosStore.buscarItem(props.projetoId);
  }

  if (!portfolioId || props.projetoId) {
    portfolioStore.buscarTudo();
  }

  OrgansStore.getAllOrganResponsibles().finally(() => {
    chamadasPendentes.value.emFoco = false;
  });
}

iniciar();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Editar projeto' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <Form
    v-slot="{ errors, isSubmitting, resetField, values }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdição"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div
        v-show="!portfolioId"
        class="f1 mb1"
      >
        <label class="label">
          Portfolio <span class="tvermelho">*</span>
        </label>

        <Field
          name="portfolio_id"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.portfolio_id, loading: portfolioStore.chamadasPendentes.lista }"
          :disabled="!!portfolioId"
        >
          <option
            v-for="item in portfolioStore.lista"
            :key="item.id"
            :value="item.id"
          >
            {{ item.titulo }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="portfolio_id"
        />
      </div>

      <div class="f1 mb1">
        <label class="label">
          Nome do projeto <span class="tvermelho">*</span>
        </label>
        <Field
          name="nome"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>

      <div class="f1 mb1">
        <label class="label">
          Versão <span class="tvermelho">*</span>
        </label>
        <Field
          name="versao"
          type="text"
          class="inputtext light mb1"
          maxlength="20"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="versao"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label">Resumo</label>
        <Field
          name="resumo"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="500"
          :class="{ 'error': errors.resumo }"
        />
        <ErrorMessage
          name="resumo"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label">
          Escopo
          <small class="t13 tc500">(o que será entregue no projeto)</small>
        </label>
        <Field
          name="escopo"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          :class="{ 'error': errors.escopo }"
        />
        <ErrorMessage
          name="escopo"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label">Principais etapas</label>
        <Field
          name="principais_etapas"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          :class="{ 'error': errors.principais_etapas }"
        />
        <ErrorMessage
          name="principais_etapas"
          class="error-msg"
        />
      </div>
    </div>

    <hr class="mb1 f1">

    <label class="label mt2 mb1">
      Órgãos
    </label>
    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">Órgão gestor <span class="tvermelho">*</span></label>
        <Field
          name="orgao_gestor_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.orgao_gestor_id }"
          :disabled="!órgãosDisponíveisNessePortfolio(values.portfolio_id).length"
          @change="resetField('responsaveis_no_orgao_gestor')"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in
              órgãosDisponíveisNessePortfolio(values.portfolio_id) || []"
            :key="item.id"
            :value="item.id"
          >
            {{ item.sigla }} - {{ item.descricao }}
          </option>
        </Field>

        <ErrorMessage
          name="orgao_gestor_id"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <label class="label tc300">Responsáveis
          <span
            v-show="órgãosQueTemResponsáveisEPorId[values.orgao_gestor_id]?.responsible?.length"
            class="tvermelho"
          >*</span>
        </label>

        <AutocompleteField
          :controlador="{busca: '', participantes:
            values.responsaveis_no_orgao_gestor || []}"
          :grupo="órgãosQueTemResponsáveisEPorId[values.orgao_gestor_id]?.responsible || []"
          label="nome_exibicao"
          name="responsaveis_no_orgao_gestor"
        />
        <ErrorMessage
          name="responsaveis_no_orgao_gestor"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">Órgão responsável
          <span class="tvermelho">*</span>
        </label>
        <Field
          name="orgao_responsavel_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.orgao_responsavel_id }"
          :disabled="!órgãosQueTemResponsáveis?.length"
          @change="resetField('responsavel_id')"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in órgãosQueTemResponsáveis"
            :key="item"
            :value="item.id"
          >
            {{ item.sigla }} - {{ item.descricao }}
          </option>
        </Field>
        <ErrorMessage
          name="orgao_responsavel_id"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <label class="label tc300">Responsável <span class="tvermelho">*</span></label>
        <Field
          name="responsavel_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.responsavel_id }"
          :disabled="!órgãosQueTemResponsáveisEPorId[values.orgao_responsavel_id]
            ?.responsible?.length"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in
              órgãosQueTemResponsáveisEPorId[values.orgao_responsavel_id]?.responsible || []"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome_exibicao }}
          </option>
        </Field>

        <ErrorMessage
          name="responsavel_id"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">Orgãos participantes
          <span class="tvermelho">*</span>
        </label>

        <AutocompleteField
          :controlador="{busca: '', participantes:
            values.orgaos_participantes || []}"
          :grupo="órgãosQueTemResponsáveis"
          label="sigla"
          name="orgaos_participantes"
        />
        <ErrorMessage
          name="orgaos_participantes"
          class="error-msg"
        />
      </div>
    </div>

    <hr class="mb1 f1">

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">Origem
          <span class="tvermelho">*</span>
        </label>
        <Field
          name="origem_tipo"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.origem_tipo }"
          @change="
            buscarDadosParaOrigens($event);
            resetField(['meta_id', 'meta_codigo', 'origem_outro'])
          "
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in possíveisOrigens"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.texto }}
          </option>
        </Field>
        <ErrorMessage
          name="origem_tipo"
          class="error-msg"
        />
      </div>

      <div
        v-if="values.origem_tipo === 'PdmSistema'"
        class="f1 mb1"
      >
        <label class="label tc300">Plano de metas
          <span class="tvermelho">*</span>
        </label>
        <Field
          name="pdm_escolhido"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.origem_tipo,
            loading: chamadasPendentes.pdmsSimplificados
          }"
          :disabled="!pdmsSimplificados?.length"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in pdmsSimplificados"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="origem_tipo"
          class="error-msg"
        />
      </div>

      <div
        v-if="values.origem_tipo === 'PdmSistema'"
        class="f1 mb1"
      >
        <label class="label tc300">
          Meta vinculada <span class="tvermelho">*</span>
        </label>

        <Field
          name="meta_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.meta_id }"
          :disabled="!pdmsPorId[values.pdm_escolhido]?.metas?.length"
          @change="buscarMetaSimplificada($event); resetField('iniciativa_id')"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in pdmsPorId[values.pdm_escolhido]?.metas"
            :key="item.id"
            :value="item.id"
          >
            {{ item.codigo }} - {{ item.titulo }}
          </option>
        </Field>

        <ErrorMessage
          name="meta_id"
          class="error-msg"
        />
      </div>

      <div
        v-else-if="values.origem_tipo === 'PdmAntigo'"
        class="f1 mb1"
      >
        <label class="label tc300">Código da meta</label>

        <Field
          name="meta_codigo"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors.meta_codigo }"
          maxlength="10"
          @keyup="maskDate"
        />
        <ErrorMessage
          name="meta_codigo"
          class="error-msg"
        />
      </div>
    </div>

    <div
      v-if="values.origem_tipo === 'PdmSistema'"
      class="flex g2"
    >
      <div class="f1 mb1">
        <label class="label tc300">
          Iniciativa vinculada
        </label>

        <Field
          name="iniciativa_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.iniciativa_id,
            loading: chamadasPendentes.metaSimplificada
          }"
          :disabled="!metaSimplificada.iniciativas?.length"
          @change="resetField('atividade_id')"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in metaSimplificada.iniciativas"
            :key="item.id"
            :value="item.id"
          >
            {{ item.codigo }} - {{ item.titulo }}
          </option>
        </Field>

        <ErrorMessage
          name="iniciativa_id"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <label class="label tc300">
          Atividade vinculada
        </label>

        <Field
          name="atividade_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.atividade_id,
            loading: chamadasPendentes.metaSimplificada
          }"
          :disabled="iniciativasPorId[values.iniciativa_id]?.atividades.length"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in iniciativasPorId[values.iniciativa_id]?.atividades"
            :key="item.id"
            :value="item.id"
          >
            {{ item.codigo }} - {{ item.titulo }}
          </option>
        </Field>

        <ErrorMessage
          name="atividade_id"
          class="error-msg"
        />
      </div>
    </div>

    <div
      v-if="['PdmAntigo', 'Outro'].indexOf(values.origem_tipo) > -1"
      class="flex g2"
    >
      <div class="f1 mb1">
        <label class="label tc300">
          Descrição
        </label>

        <Field
          name="origem_outro"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          :class="{ 'error': errors.origem_outro }"
          maxlength="500"
        />
        <ErrorMessage
          name="origem_outro"
          class="error-msg"
        />
      </div>
    </div>

    <hr class="mb1 f1">

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label">
          Previsão de início
          <span class="tvermelho">*</span>
        </label>
        <Field
          name="previsao_inicio"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.previsao_inicio }"
          maxlength="10"
        />
        <ErrorMessage
          name="previsao_inicio"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <label class="label">
          Previsão de término
          <span class="tvermelho">*</span>
        </label>
        <Field
          name="previsao_termino"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.previsao_termino }"
          maxlength="10"
        />
        <ErrorMessage
          name="previsao_termino"
          class="error-msg"
        />
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

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
