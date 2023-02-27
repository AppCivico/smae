<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CheckClose from '@/components/CheckClose.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import MenuDeMudançaDeStatusDeProjeto from '@/components/projetos/MenuDeMudançaDeStatusDeProjeto.vue';
import { projeto as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/truncate';
import {
useAlertStore, useOrcamentosStore, useOrgansStore, usePortfolioStore, useProjetosStore
} from '@/stores';
import { storeToRefs } from 'pinia';
import {
ErrorMessage, Field, FieldArray, Form
} from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const ÓrgãosStore = useOrgansStore();
const OrçamentosStore = useOrcamentosStore();
const alertStore = useAlertStore();
const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const {
  chamadasPendentes, emFoco, erro, permissões, pdmsSimplificados, pdmsPorId, metaSimplificada,
} = storeToRefs(projetosStore);
const { órgãosQueTemResponsáveis, órgãosQueTemResponsáveisEPorId } = storeToRefs(ÓrgãosStore);
const { DotacaoSegmentos } = storeToRefs(OrçamentosStore);

const router = useRouter();
const route = useRoute();

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

const portfolioId = Number.parseInt(route.query.portfolio_id, 10) || undefined;

const itemParaEdição = computed(() => {
  const valores = props?.projetoId
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
      previsao_custo: 0,
      principais_etapas: '',
      resumo: '',
    };

  if (valores.meta_codigo == null) {
    valores.meta_codigo = '';
  }
  if (valores.origem_outro == null) {
    valores.origem_outro = '';
  }

  if (props?.projetoId) {
    const propriedadesParaSimplificar = [
      'orgao_gestor',
      'orgao_responsavel',
      'responsavel',
      'orgaos_participantes',
      'responsaveis_no_orgao_gestor',
    ];

    const datasParaLimpar = [
      'previsao_inicio',
      'previsao_termino',
      'realizado_inicio',
      'realizado_termino',
      'data_aprovacao',
      'data_revisao',
    ];

    propriedadesParaSimplificar.forEach((x) => {
      if (Array.isArray(valores[x])) {
        valores[x] = valores[x].map((y) => y.id || y);
      } else if (valores[x] && typeof valores[x] === 'object') {
        valores[`${x}_id`] = valores[x].id;
      }
    });

    datasParaLimpar.forEach((x) => {
      if (valores[x]?.indexOf('T') === 10) {
        [valores[x]] = valores[x].split('T');
      }
    });
    if (valores.meta?.pdm_id) {
      valores.pdm_escolhido = valores.meta.pdm_id;
    }
  }
  return valores;
});

const órgãosDisponíveisNessePortfolio = ((idDoPortfólio) => portfolioStore
  .portfoliosPorId?.[idDoPortfólio]?.orgaos
  .filter((x) => órgãosQueTemResponsáveisEPorId.value?.[x.id]?.responsible?.length) || []);

const iniciativasPorId = computed(() => (Array.isArray(metaSimplificada.value?.iniciativas)
  ? metaSimplificada.value.iniciativas.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {})
  : {}));

const possíveisOrigens = [
  {
    texto: 'Programa de Metas',
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

async function buscarDadosParaOrigens(valorOuEvento) {
  const valor = valorOuEvento.target?.value || valorOuEvento;

  switch (valor) {
    case 'PdmSistema':
      if (!pdmsSimplificados.value.length) {
        await projetosStore.buscarPdms();
      }
      break;

    default:
      break;
  }
}

function BuscarDotaçãoParaAno(valorOuEvento) {
  const ano = valorOuEvento.target?.value || valorOuEvento;

  if (!DotacaoSegmentos?.value?.[ano]) {
    OrçamentosStore.getDotacaoSegmentos(ano);
  }
}

async function buscarMetaSimplificada(valorOuEvento) {
  const idDaMeta = valorOuEvento.target?.value || valorOuEvento;

  if (idDaMeta) {
    await projetosStore.buscarMetaSimplificada({ meta_ids: idDaMeta });
  }
}

async function onSubmit(_, { controlledValues: valores }) {
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

async function iniciar() {
  if (props.projetoId) {
    if (emFoco.value?.origem_tipo) {
      buscarDadosParaOrigens(emFoco.value.origem_tipo);
    }

    if (emFoco.value?.meta_id) {
      buscarMetaSimplificada(emFoco.value?.meta_id);
    }

    if (emFoco.value?.fonte_recursos?.length) {
      emFoco.value.fonte_recursos.forEach((x) => {
        BuscarDotaçãoParaAno(x.fonte_recurso_ano);
      });
    }
  }

  if (!portfolioStore.lista?.length) {
    portfolioStore.buscarTudo();
  }

  ÓrgãosStore.getAllOrganResponsibles().finally(() => {
    chamadasPendentes.value.emFoco = false;
  });
}

iniciar();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Editar projeto' }}</h1>

    <template v-if="projetoId">
      <hr class="ml2 f1">
      <MenuDeMudançaDeStatusDeProjeto />
    </template>

    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <Form
    v-if="!projetoId || emFoco"
    v-slot="{ errors, isSubmitting, setFieldValue, values }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdição"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <label class="label">
          Portfolio&nbsp;<span class="tvermelho">*</span>
        </label>

        <Field
          name="portfolio_id"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.portfolio_id, loading: portfolioStore.chamadasPendentes.lista }"
          :disabled="!!portfolioId"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in portfolioStore.lista"
            :key="item.id"
            :value="item.id"
            :disabled="!órgãosDisponíveisNessePortfolio(item.id)?.length"
          >
            {{ item.titulo }}
            <template v-if="!órgãosDisponíveisNessePortfolio(item.id)?.length">
              (órgão sem responsáveis cadastrados)
            </template>
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="portfolio_id"
        />
      </div>

      <div
        v-if="projetoId"
        class="f1 mb1"
      >
        <label class="label">
          Código
        </label>
        <Field
          name="codigo"
          type="text"
          class="inputtext light mb1"
          maxlength="20"
          :disabled="!permissões?.campo_codigo"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="codigo"
        />
      </div>

      <div class="f1 mb1">
        <label class="label">
          Nome do projeto&nbsp;<span class="tvermelho">*</span>
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
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label">
          Resumo&nbsp;<span class="tvermelho">*</span>
        </label>
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
          Escopo&nbsp;<span class="tvermelho">*</span>
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

      <div
        v-if="projetoId"
        class="f1 mb1"
      >
        <label class="label">
          Não escopo
          <small class="t13 tc500">(o que <strong>não</strong> será entregue no projeto)</small>
        </label>
        <Field
          name="nao_escopo"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          :class="{ 'error': errors.nao_escopo }"
          :disabled="!permissões?.campo_nao_escopo"
        />
        <ErrorMessage
          name="nao_escopo"
          class="error-msg"
        />
      </div>
    </div>

    <template v-if="projetoId">
      <div class="flex g2" />
      <div class="flex g2">
        <div class="f1 mb1">
          <label class="label">
            Objetivo
          </label>
          <Field
            name="objetivo"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ 'error': errors.objetivo }"
            :disabled="!permissões?.campo_objetivo"
          />
          <ErrorMessage
            name="objetivo"
            class="error-msg"
          />
        </div>
      </div>
      <div class="flex g2">
        <div class="f1 mb1">
          <label class="label">
            Objeto
          </label>
          <Field
            name="objeto"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ 'error': errors.objeto }"
            :disabled="!permissões?.campo_objeto"
          />
          <ErrorMessage
            name="objeto"
            class="error-msg"
          />
        </div>
      </div>
      <div class="flex g2">
        <div class="f1 mb1">
          <label class="label">
            Público alvo
          </label>
          <Field
            name="publico_alvo"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ 'error': errors.publico_alvo }"
            :disabled="!permissões?.campo_publico_alvo"
          />
          <ErrorMessage
            name="publico_alvo"
            class="error-msg"
          />
        </div>
      </div>
    </template>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label">
          Principais etapas&nbsp;<span class="tvermelho">*</span>
        </label>
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
        <label class="label tc300">
          Órgão gestor&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="orgao_gestor_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_gestor_id ,
            loading: ÓrgãosStore.organs.loading,
          }"
          :disabled="!órgãosDisponíveisNessePortfolio(values.portfolio_id).length"
          @change="setFieldValue('responsaveis_no_orgao_gestor', [])"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in
              órgãosDisponíveisNessePortfolio(values.portfolio_id) || []"
            :key="item.id"
            :value="item.id"
            :title="item.descricao"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>

        <ErrorMessage
          name="orgao_gestor_id"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <label class="label tc300">Responsáveis&nbsp;<span class="tvermelho">*</span>
        </label>

        <AutocompleteField
          name="responsaveis_no_orgao_gestor"
          :controlador="{
            busca: '',
            participantes: values.responsaveis_no_orgao_gestor || []
          }"
          :grupo="órgãosQueTemResponsáveisEPorId[values.orgao_gestor_id]?.responsible
            || []"
          :class="{
            error: errors.responsaveis_no_orgao_gestor,
            loading: portfolioStore.chamadasPendentes.lista
          }"
          label="nome_exibicao"
        />
        <ErrorMessage
          name="responsaveis_no_orgao_gestor"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">Orgãos participantes&nbsp;<span class="tvermelho">*</span>
        </label>

        <AutocompleteField
          name="orgaos_participantes"
          :controlador="{
            busca: '',
            participantes: values.orgaos_participantes || []
          }"
          :class="{
            error: errors.orgaos_participantes,
            loading: portfolioStore.chamadasPendentes.lista
          }"
          :grupo="órgãosQueTemResponsáveis"
          label="sigla"
        />
        <ErrorMessage
          name="orgaos_participantes"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">Órgão responsável&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="orgao_responsavel_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_responsavel_id,
            loading: portfolioStore.chamadasPendentes.lista
          }"
          :disabled="!órgãosQueTemResponsáveis?.length"
          @change="setFieldValue('responsavel_id', 0)"
        >
          <option :value="0">
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
        <label class="label tc300">Responsável&nbsp;<span class="tvermelho">*</span></label>
        <Field
          name="responsavel_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.responsavel_id,
            loading: portfolioStore.chamadasPendentes.lista
          }"
          :disabled="!órgãosQueTemResponsáveisEPorId[values.orgao_responsavel_id]
            ?.responsible?.length"
        >
          <option :value="0">
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

    <hr class="mb1 f1">

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">Origem&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="origem_tipo"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.origem_tipo }"
          @change="
            buscarDadosParaOrigens($event);
            setFieldValue('meta_id',null);
            setFieldValue('meta_codigo', null);
            setFieldValue('origem_outro', null);
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
        <label class="label tc300">
          Programa de metas&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="pdm_escolhido"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.pdm_escolhido,
            loading: chamadasPendentes.pdmsSimplificados
          }"
          :disabled="!pdmsSimplificados?.length"
        >
          <option :value="0">
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
          name="pdm_escolhido"
          class="error-msg"
        />
      </div>

      <div
        v-if="values.origem_tipo === 'PdmSistema'"
        class="f1 mb1"
      >
        <label class="label tc300">
          Meta vinculada&nbsp;<span class="tvermelho">*</span>
        </label>

        <Field
          name="meta_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.meta_id }"
          :disabled="!pdmsPorId[values.pdm_escolhido]?.metas?.length"
          @change="buscarMetaSimplificada($event); setFieldValue('iniciativa_id', null)"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in pdmsPorId[values.pdm_escolhido]?.metas"
            :key="item.id"
            :value="item.id"
            :title="item.titulo"
          >
            {{ item.codigo }} - {{ truncate(item.titulo, 36) }}
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
          @change="setFieldValue('atividade_id', null)"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in metaSimplificada.iniciativas"
            :key="item.id"
            :value="item.id"
            :title="item.titulo"
          >
            {{ item.codigo }} - {{ truncate(item.titulo, 36) }}
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
          :disabled="!iniciativasPorId[values.iniciativa_id]?.atividades.length"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in iniciativasPorId[values.iniciativa_id]?.atividades"
            :key="item.id"
            :value="item.id"
            :title="item.titulo"
          >
            {{ item.codigo }} - {{ truncate(item.titulo, 36) }}
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
          Descrição&nbsp;<span class="tvermelho">*</span>
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
          Previsão de início&nbsp;<span class="tvermelho">*</span>
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
          Previsão de término&nbsp;<span class="tvermelho">*</span>
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

    <div
      v-show="projetoId"
      class="flex g2"
    >
      <div class="f1 mb1">
        <label class="label">
          Previsão de custo&nbsp;<span class="tvermelho">*</span>
        </label>
        <MaskedFloatInput
          name="previsao_custo"
          :value="values.previsao_custo"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="previsao_custo"
        />
      </div>
    </div>

    <template v-if="projetoId">
      <hr class="mb1 f1">

      <div class="g2 mb2">
        <legend class="label mt2 mb1">
          Fontes de recursos
        </legend>

        <FieldArray
          v-slot="{ fields, push, remove }"
          name="fonte_recursos"
        >
          <div
            v-for="(field, idx) in fields"
            :key="`fonteRecursos--${field.key}`"
            class="flex g2"
          >
            <Field
              :name="`fonte_recursos[${idx}].id`"
              type="hidden"
            />

            <div class="f1 mb1">
              <label class="label tc300">
                Ano&nbsp;<span class="tvermelho">*</span>
              </label>
              <Field
                :name="`fonte_recursos[${idx}].fonte_recurso_ano`"
                type="number"
                class="inputtext light mb1"
                min="2003"
                max="3000"
                step="1"
                @change="BuscarDotaçãoParaAno"
              />
              <ErrorMessage
                class="error-msg mb1"
                :name="`fonte_recursos[${idx}].fonte_recurso_ano`"
              />
            </div>

            <div class="f1 mb1">
              <label class="label tc300">
                Fonte de recursos&nbsp;<span class="tvermelho">*</span>
              </label>
              <Field
                :name="`fonte_recursos[${idx}].fonte_recurso_cod_sof`"
                type="text"
                maxlength="2"
                class="inputtext light mb1"
                as="select"
              >
                <option value="">
                  Selecionar
                </option>
                <option
                  v-for="item in
                    DotacaoSegmentos?.[fields[idx].value.fonte_recurso_ano]?.fonte_recursos || []"
                  :key="item.codigo"
                  :value="item.codigo"
                  :title="item.descricao"
                >
                  {{ item.codigo }} - {{ truncate(item.descricao, 36) }}
                </option>
              </Field>
              <ErrorMessage
                class="error-msg mb1"
                :name="`fonte_recursos[${idx}].fonte_recurso_cod_sof`"
              />
            </div>

            <div class="f1 mb1">
              <label class="label tc300">
                Valor nominal&nbsp;<span
                  v-if="!fields[idx].value.valor_percentual"
                  class="tvermelho"
                >*</span>
              </label>
              <MaskedFloatInput
                :name="`fonte_recursos[${idx}].valor_nominal`"
                :value="fields[idx].value.valor_nominal"
                class="inputtext light mb1"
                @input="setFieldValue(`fonte_recursos[${idx}].valor_percentual`, null)"
              />
              <ErrorMessage
                class="error-msg mb1"
                :name="`fonte_recursos[${idx}].valor_nominal`"
              />
            </div>

            <div class="f1 mb1">
              <label class="label tc300">
                Valor percentual&nbsp;<span
                  v-if="!fields[idx].value.valor_nominal"
                  class="tvermelho"
                >*</span>
              </label>
              <MaskedFloatInput
                :name="`fonte_recursos[${idx}].valor_percentual`"
                :value="fields[idx].value.valor_percentual"
                class="inputtext light mb1"
                @input="setFieldValue(`fonte_recursos[${idx}].valor_nominal`, null)"
              />
              <ErrorMessage
                class="error-msg mb1"
                :name="`fonte_recursos[${idx}].valor_percentual`"
              />
            </div>

            <button
              class="like-a__text addlink"
              arial-label="excluir"
              title="excluir"
              @click="remove(idx)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </div>

          <button
            class="like-a__text addlink"
            type="button"
            @click="push({
              fonte_recurso_cod_sof: '',
              fonte_recurso_ano: null,
              valor_nominal: null,
              valor_percentual: null,
            })"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>Adicionar fonte de recursos
          </button>
        </FieldArray>
      </div>
    </template>

    <template v-if="projetoId">
      <hr class="mb1 f1">

      <div class="g2 mb2">
        <legend class="label mt2 mb1">
          Premissas
        </legend>

        <FieldArray
          v-slot="{ fields, push, remove }"
          name="premissas"
        >
          <div
            v-for="(field, idx) in fields"
            :key="`premissas--${field.key}`"
            class="flex g2"
          >
            <Field
              :name="`premissas[${idx}].id`"
              type="hidden"
            />

            <div class="f1 mb1">
              <Field
                arial-label="Texto da premissa"
                :name="`premissas[${idx}].premissa`"
                type="text"
                class="inputtext light mb1"
              />
              <ErrorMessage
                class="error-msg mb1"
                :name="`premissas[${idx}].premissa`"
              />
            </div>

            <button
              class="like-a__text addlink"
              arial-label="excluir"
              title="excluir"
              @click="remove(idx)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </div>

          <button
            class="like-a__text addlink"
            type="button"
            @click="push({
              premissa: '',
            })"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>Adicionar premissa
          </button>
        </FieldArray>
      </div>
    </template>

    <template v-if="projetoId">
      <hr class="mb1 f1">

      <div class="g2 mb2">
        <legend class="label mt2 mb1">
          Restrições
        </legend>

        <FieldArray
          v-slot="{ fields, push, remove }"
          name="restricoes"
        >
          <div
            v-for="(field, idx) in fields"
            :key="`restricoes--${field.key}`"
            class="flex g2"
          >
            <Field
              :name="`restricoes[${idx}].id`"
              type="hidden"
            />

            <div class="f1 mb1">
              <Field
                arial-label="Texto da restrição"
                :name="`restricoes[${idx}].restricao`"
                type="text"
                class="inputtext light mb1"
              />
              <ErrorMessage
                class="error-msg mb1"
                :name="`restricoes[${idx}].restricao`"
              />
            </div>

            <button
              class="like-a__text addlink"
              arial-label="excluir"
              title="excluir"
              @click="remove(idx)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </div>

          <button
            class="like-a__text addlink"
            type="button"
            @click="push({
              restricao: '',
            })"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>Adicionar restrição
          </button>
        </FieldArray>
      </div>
    </template>

    <hr class="mt1 f1 mb1">

    <div
      v-if="projetoId"
      class="flex g2 mb1"
    >
      <div class="f1 mb1">
        <label class="label">
          Coordenador do órgão gestor do projeto
        </label>
        <Field
          name="coordenador_ue"
          type="text"
          class="inputtext light mb1"
          :disabled="!permissões?.campo_coordenador_ue"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="coordenador_ue"
        />
      </div>

      <div class="f1 mb1">
        <label class="label">
          Secretário executivo
        </label>
        <Field
          name="secretario_executivo"
          type="text"
          class="inputtext light mb1"
          :disabled="!permissões?.campo_secretario_executivo"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="secretario_executivo"
        />
      </div>

      <div class="f1 mb1">
        <label class="label">
          Secretário responsável
        </label>
        <Field
          name="secretario_responsavel"
          type="text"
          class="inputtext light mb1"
          :disabled="!permissões?.campo_secretario_responsavel"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="secretario_responsavel"
        />
      </div>
    </div>

    <div
      v-show="projetoId"
      class="flex g2"
    >
      <div
        :disabled="!permissões?.campo_versao"
        class="f1 mb1"
      >
        <label class="label">
          Versão
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

      <div
        :disabled="!permissões?.campo_data_aprovacao"
        class="f1 mb1"
      >
        <label class="label">
          Data de aprovação
        </label>
        <Field
          name="data_aprovacao"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.data_aprovacao }"
          maxlength="10"
        />
        <ErrorMessage
          name="data_aprovacao"
          class="error-msg"
        />
      </div>
      <div
        :disabled="!permissões?.campo_data_revisao"
        class="f1 mb1"
      >
        <label class="label">
          Data de revisão
        </label>
        <Field
          name="data_revisao"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.data_revisao }"
          maxlength="10"
        />
        <ErrorMessage
          name="data_revisao"
          class="error-msg"
        />
      </div>
    </div>

    <pre>
debugger para a Josi:
{{ errors }}
</pre>

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
