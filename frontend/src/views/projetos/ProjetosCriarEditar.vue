<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CampoDePessoasComBuscaPorOrgao from '@/components/CampoDePessoasComBuscaPorOrgao.vue';
import CampoDePlanosMetasRelacionados from '@/components/CampoDePlanosMetasRelacionados.vue';
import SmaeText from '@/components/camposDeFormulario/SmaeText.vue';
import MapaCampo from '@/components/geo/MapaCampo.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import MenuDeMudançaDeStatusDeProjeto from '@/components/projetos/MenuDeMudançaDeStatusDeProjeto.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import { projeto as schema } from '@/consts/formSchemas';
import listaDeStatuses from '@/consts/projectStatuses';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useObservadoresStore } from '@/stores/observadores.store.ts';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import SmaeTooltip from '@/components/SmaeTooltip/SmaeTooltip.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const ÓrgãosStore = useOrgansStore();
const DotaçãoStore = useDotaçãoStore();
const alertStore = useAlertStore();
const observadoresStore = useObservadoresStore();
const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const {
  lista: gruposDeObservadores,
  chamadasPendentes: gruposDeObservadoresPendentes,
  erro: erroNosGruposDeObservadores,
} = storeToRefs(observadoresStore);

const {
  chamadasPendentes,
  emFoco,
  erro,
  geolocalizaçãoPorToken,
  itemParaEdicao,
  pdmsSimplificados,
  pdmsSimplificadosPorTipo,
  pdmsPorId,
  planosAgrupadosPorTipo,
  arvoreDeMetas,
} = storeToRefs(projetosStore);
const {
  órgãosComoLista,
  órgãosQueTemResponsáveis,
  órgãosQueTemResponsáveisEPorId,
} = storeToRefs(ÓrgãosStore);

const { DotaçãoSegmentos } = storeToRefs(DotaçãoStore);

const router = useRouter();
const route = useRoute();
const formularioSujo = useIsFormDirty();

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

const {
  errors,
  controlledValues,
  handleSubmit,
  isSubmitting,
  resetForm,
  resetField,
  setFieldValue,
  values,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const portfolioId = Number.parseInt(route.query.portfolio_id, 10) || undefined;
const possíveisGestores = ref([]);
const possíveisColaboradores = ref([]);
const portfóliosDisponíveis = computed(() => {
  if (!emFoco.value?.portfolio_id) {
    return [];
  }

  const órgãosDoPortfólioCorrente = portfolioStore.portfoliosPorId[emFoco.value.portfolio_id]
    ?.orgaos.map((x) => x.id) || [];

  return portfolioStore.lista
    .filter((x) => x.id !== emFoco.value.portfolio_id
      // limitar portfólios disponíveis aqueles com órgãos em comum com o principal
      && x?.orgaos.some((y) => órgãosDoPortfólioCorrente.includes(y.id)));
});

const possíveisGestoresPorÓrgãoId = computed(() => possíveisGestores.value
  .reduce((acc, cur) => {
    if (!acc[cur.orgao_id]) {
      acc[cur.orgao_id] = [];
    }
    acc[cur.orgao_id].push(cur);
    return acc;
  }, {}));

const possíveisResponsáveisPorÓrgãoId = computed(() => possíveisColaboradores.value
  .reduce((acc, cur) => {
    if (!acc[cur.orgao_id]) {
      acc[cur.orgao_id] = [];
    }
    acc[cur.orgao_id].push(cur);
    return acc;
  }, {}));

const orgaosDisponiveisPorPortolio = computed(() => portfolioStore.lista.reduce((acc, cur) => {
  acc[cur.id] = cur.orgaos.filter((x) => !!órgãosQueTemResponsáveisEPorId.value?.[x.id]) || [];
  return acc;
}, {}));

const possíveisOrigens = [
  {
    texto: 'Programa de metas / Plano setorial',
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

function BuscarDotaçãoParaAno(valorOuEvento) {
  const ano = valorOuEvento.target?.value || valorOuEvento;

  if (!DotaçãoSegmentos?.value?.[ano]) {
    DotaçãoStore.getDotaçãoSegmentos(ano);
  }
}

async function buscarArvoreDeMetas(valorOuEvento) {
  const idDaMeta = valorOuEvento.target?.value || valorOuEvento;

  if (idDaMeta && !arvoreDeMetas.value?.[idDaMeta]) {
    await projetosStore.buscarArvoreDeMetas({ meta_ids: idDaMeta });
  }
}

async function buscarPossíveisGestores() {
  try {
    const { linhas } = await requestS.get(`${baseUrl}/pessoa`, { gestor_de_projeto: true });

    if (Array.isArray(linhas)) {
      possíveisGestores.value = linhas;
    } else {
      throw new Error('Lista de Gestores fora do formato esperado');
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function buscarPossíveisColaboradores() {
  try {
    const { linhas } = await requestS.get(`${baseUrl}/pessoa`, { colaborador_de_projeto: true });

    if (Array.isArray(linhas)) {
      possíveisColaboradores.value = linhas;
    } else {
      throw new Error('Lista de Responsáveis fora do formato esperado');
    }
  } catch (error) {
    alertStore.error(error);
  }
}

// PRA-FAZER: não usando o `controlledValues` devido à algum erro no campo de
// mapa. Trazer de volta.
const onSubmit = handleSubmit(async () => {
  const carga = values;

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
        ? {
          name: 'projetosResumo',
          params: { projetoId: resposta.id },
        }
        : {
          name: 'projetosEditar',
          params: { projetoId: resposta.id },
        };

      alertStore.success(msg);
      emFoco.value = null;
      projetosStore.buscarItem(props.projetoId || resposta.id);
      router.push(rotaApósSalvamento);
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function iniciar() {
  buscarPossíveisGestores();
  buscarPossíveisColaboradores();
  projetosStore.buscarPdms({ apenas_pdm: false });

  if (emFoco.value?.portfolio_id) {
    observadoresStore.buscarTudo();
  }

  ÓrgãosStore.getAllOrganResponsibles().finally(() => {
    chamadasPendentes.value.emFoco = false;
  });

  if (emFoco.value?.meta_id) {
    buscarArvoreDeMetas(emFoco.value?.meta_id);
  }
}

watch(emFoco, () => {
  iniciar();
}, { immediate: true });

watch(itemParaEdicao, (novoValor) => {
  resetForm({
    initialValues: novoValor,
  });
});
</script>

<template>
  <header class="flex flexwrap spacebetween g1 center mb2">
    <TituloDaPagina />

    <hr class="f1">

    <MenuDeMudançaDeStatusDeProjeto v-if="projetoId" />

    <CheckClose :formulario-sujo="formularioSujo" />
  </header>

  <SmaeTooltip texto="meu texto">
    conteudo slot

    <template #botao>
      <div>1234</div>
    </template>
  </SmaeTooltip>

  <form
    v-if="!projetoId || emFoco"
    @submit.prevent="!isSubmitting ? onSubmit() : null"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          informativo="123"
          name="portfolio_id"
          :schema="schema"
        >
          <template #append>
            <router-link
              v-if="portfóliosDisponíveis.length"
              :to="{
                name: 'projetosTrocarPortfolio'
              }"
              class="ml05 tipinfo"
              aria-label="Trocar de portfolio"
            >
              <svg
                width="10"
                height="10"
              >
                <use xlink:href="#i_edit" />
              </svg>
              <div>Trocar de portfolio</div>
            </router-link>
          </template>
        </LabelFromYup>
        <Field
          name="portfolio_id"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.portfolio_id, loading: portfolioStore.chamadasPendentes.lista }"
          :disabled="!!portfolioId || !!projetoId"
          @change="() => setFieldValue('regiao_id', 0)"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in portfolioStore.lista"
            :key="item.id"
            :value="item.id"
            :disabled="!orgaosDisponiveisPorPortolio[item.id]?.length"
          >
            {{ item.titulo }}
            <template v-if="!orgaosDisponiveisPorPortolio[item.id]?.length">
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
        <LabelFromYup
          informativo="123"
          name="codigo"
          :schema="schema"
        />
        <Field
          name="codigo"
          type="text"
          class="inputtext light mb1"
          maxlength="20"
          :disabled="!emFoco?.permissoes?.campo_codigo"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="codigo"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="nome"
          :schema="schema"
        />
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

      <div
        v-if="projetoId"
        class="f05 mb1"
      >
        <LabelFromYup
          name="status"
          :schema="schema"
        />
        <Field
          name="status"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.status }"
          :disabled="!emFoco?.permissoes.status_permitidos?.length"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in listaDeStatuses"
            :key="item.valor"
            :value="item.valor"
            :disabled="emFoco?.permissoes.status_permitidos?.indexOf(item.valor) === -1"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="status"
        />
      </div>
    </div>

    <div
      v-if="projetoId"
      class="flex g2 mb1"
    >
      <div class="f1 mb1">
        <LabelFromYup
          name="portfolios_compartilhados"
          :schema="schema"
        />

        <AutocompleteField
          name="portfolios_compartilhados"
          :controlador="{
            busca: '',
            participantes: values.portfolios_compartilhados || []
          }"
          :grupo="portfóliosDisponíveis"
          :class="{
            error: errors.portfolios_compartilhados,
            loading: portfolioStore.chamadasPendentes.lista
          }"
          label="titulo"
        />
        <ErrorMessage
          name="portfolios_compartilhados"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        1
        <LabelFromYup

          name="resumo"
          :schema="schema"
        >
          <!-- <template #informacao>
            slot
          </template> -->
        </LabelFromYup>
        <SmaeText
          v-model="values.resumo"
          name="resumo"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          anular-vazio
          :class="{ 'error': errors.resumo }"
        />
        <ErrorMessage
          name="resumo"
          class="error-msg"
        />
      </div>
    </div>

    <template v-if="projetoId">
      <div class="flex g2">
        <div class="f1 mb1">
          <LabelFromYup
            name="objeto"
            :schema="schema"
          />
          <SmaeText
            v-model="values.objeto"
            name="objeto"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            maxlength="2048"
            anular-vazio
            :class="{ 'error': errors.objeto }"
            :disabled="!emFoco?.permissoes?.campo_objeto"
          />
          <ErrorMessage
            name="objeto"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2">
        <div class="f1 mb1">
          <LabelFromYup
            name="objetivo"
            :schema="schema"
          />
          <SmaeText
            v-model="values.objetivo"
            name="objetivo"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            maxlength="2048"
            anular-vazio
            :class="{ 'error': errors.objetivo }"
            :disabled="!emFoco?.permissoes?.campo_objetivo"
          />
          <ErrorMessage
            name="objetivo"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2">
        <div class="f1 mb1">
          <LabelFromYup
            name="publico_alvo"
            :schema="schema"
          />
          <SmaeText
            v-model="values.publico_alvo"
            name="publico_alvo"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            maxlength="2048"
            anular-vazio
            :class="{ 'error': errors.publico_alvo }"
            :disabled="!emFoco?.permissoes?.campo_publico_alvo"
          />
          <ErrorMessage
            name="publico_alvo"
            class="error-msg"
          />
        </div>
      </div>
    </template>

    <template v-if="projetoId">
      <hr class="mb1 f1">

      <div class="g2 mb2">
        <LabelFromYup
          :schema="schema"
          name="premissas"
          as="legend"
          class="label mt2 mb1"
        />

        <FieldArray
          v-slot="{ fields, push, remove, handleChange }"
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
              <SmaeText
                :name="`premissas[${idx}].premissa`"
                as="textarea"
                rows="5"
                class="inputtext light mb1"
                :max-length="2048"
                :schema="schema"
                :model-value="fields[idx]?.value?.premissa"
                anular-vazio
                :class="{ 'error': errors[`fields[${idx}].premissa`] }"
                @update:model-value="handleChange"
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
              >
                <use xlink:href="#i_remove" />
              </svg>
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
            >
              <use xlink:href="#i_+" />
            </svg>Adicionar premissa
          </button>
        </FieldArray>
      </div>
    </template>

    <template v-if="projetoId">
      <hr class="mb1 f1">

      <div class="g2 mb2">
        <LabelFromYup
          :schema="schema"
          name="restricoes"
          as="legend"
          class="label mt2 mb1"
        />

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
              <SmaeText
                :name="`restricoes[${idx}].restricao`"
                as="textarea"
                rows="5"
                class="inputtext light mb1"
                :max-length="2048"
                :schema="schema"
                :model-value="fields[idx]?.value?.restricao"
                anular-vazio
                :class="{ 'error': errors[`fields[${idx}].restricao`] }"
                @update:model-value="handleChange"
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
              >
                <use xlink:href="#i_remove" />
              </svg>
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
            >
              <use xlink:href="#i_+" />
            </svg>Adicionar restrição
          </button>
        </FieldArray>
      </div>
    </template>

    <hr class="mt1 f1 mb1">

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="principais_etapas"
          :schema="schema"
        />
        <SmaeText
          v-model="values.principais_etapas"
          name="principais_etapas"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          anular-vazio
          :class="{ 'error': errors.principais_etapas }"
        />
        <ErrorMessage
          name="principais_etapas"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div
        v-if="projetoId"
        class="f1 mb1"
      >
        <LabelFromYup
          name="nao_escopo"
          :schema="schema"
        >
          Não escopo
          <small class="t13 tc500">(o que <strong>não</strong> será entregue no projeto)</small>
        </LabelFromYup>
        <SmaeText
          v-model="values.nao_escopo"
          name="nao_escopo"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          anular-vazio
          :class="{ 'error': errors.nao_escopo }"
          :disabled="!emFoco?.permissoes?.campo_nao_escopo"
        />
        <ErrorMessage
          name="nao_escopo"
          class="error-msg"
        />
      </div>
    </div>

    <div
      v-if="projetoId"
      class="mb1"
    >
      <legend class="label mt2 mb1legend">
        Localização
      </legend>

      <MapaCampo
        v-model="values.geolocalizacao"
        name="geolocalizacao"
        :geolocalização-por-token="geolocalizaçãoPorToken"
      />
    </div>

    <template v-if="projetoId">
      <div class="mb2">
        <legend class="label mt2 mb1">
          {{ schema.fields.fonte_recursos.spec.label }}
        </legend>

        <FieldArray
          v-slot="{ fields, push, remove }"
          name="fonte_recursos"
        >
          <div
            v-for="(field, idx) in fields"
            :key="`fonteRecursos--${field.key}`"
            class="flex flexwrap g2 mb2"
          >
            <Field
              :name="`fonte_recursos[${idx}].id`"
              type="hidden"
            />

            <div class="f1 mb1">
              <LabelFromYup
                name="fonte_recurso_ano"
                :for="`fonte_recursos[${idx}].fonte_recurso_ano`"
                class="tc300"
                :schema="schema.fields.fonte_recursos.innerType"
              />

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
              <LabelFromYup
                name="fonte_recurso_cod_sof"
                :for="`fonte_recursos[${idx}].fonte_recurso_cod_sof`"
                class="tc300"
                :schema="schema.fields.fonte_recursos.innerType"
              />

              <Field
                :name="`fonte_recursos[${idx}].fonte_recurso_cod_sof`"
                maxlength="2"
                class="inputtext light mb1"
                as="select"
              >
                <option value="">
                  Selecionar
                </option>
                <option
                  v-for="item in
                    DotaçãoSegmentos?.[fields[idx].value.fonte_recurso_ano]?.fonte_recursos || []"
                  :key="item.codigo"
                  :value="item.codigo"
                  :title="item.descricao?.length > 36 ? item.descricao : null"
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
                Previsão de custo&nbsp;<span
                  v-if="!fields[idx].value.valor_percentual"
                  class="tvermelho"
                >*</span>
              </label>
              <MaskedFloatInput
                :name="`fonte_recursos[${idx}].valor_nominal`"
                :value="fields[idx].value.valor_nominal"
                class="inputtext light mb1"
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
              type="button"
              @click="remove(idx)"
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_remove" />
              </svg>
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
            >
              <use xlink:href="#i_+" />
            </svg>Adicionar fonte de recursos
          </button>
        </FieldArray>
      </div>
    </template>

    <fieldset class="p0">
      <hr class="mb2 f1">

      <div class="flex flexwrap g2">
        <div class="f1 mb1">
          <LabelFromYup
            name="origem_tipo"
            :schema="schema"
          />
          <Field
            name="origem_tipo"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.origem_tipo }"
            @change="() => {
              setFieldValue('meta_id', null);
              setFieldValue('meta_codigo', null);
              setFieldValue('origem_outro', null);
            }"
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
            Programa de metas / Plano setorial&nbsp;<span class="tvermelho">*</span>
          </label>
          <Field
            name="pdm_escolhido"
            as="select"
            class="inputtext light mb1"
            :class="{
              error: errors.pdm_escolhido,
              loading: chamadasPendentes.pdmsSimplificados
            }"
            :disabled="!pdmsSimplificadosPorTipo['PDM']?.length"
          >
            <option :value="0">
              Selecionar
            </option>
            <optgroup label="Programa de metas">
              <option
                v-for="item in pdmsSimplificadosPorTipo['PDM']"
                :key="item.id"
                :value="item.id"
              >
                {{ item.nome }}
              </option>
            </optgroup>
            <optgroup label="Planos setoriais">
              <option
                v-for="item in pdmsSimplificadosPorTipo['PS']"
                :key="item.id"
                :value="item.id"
              >
                {{ item.nome }}
              </option>
            </optgroup>
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
            @change="($e) => {
              buscarArvoreDeMetas($e.target.value);
              setFieldValue('iniciativa_id', null);
            }"
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
          />
          <ErrorMessage
            name="meta_codigo"
            class="error-msg"
          />
        </div>
      </div>

      <div
        v-if="values.origem_tipo === 'PdmSistema'"
        class="flex flexwrap g2"
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
              loading: chamadasPendentes.arvoreDeMetas
            }"
            :disabled="!arvoreDeMetas?.[values.meta_id]?.iniciativas?.length"
            @change="setFieldValue('atividade_id', null)"
          >
            <option :value="null">
              Selecionar
            </option>
            <option
              v-for="item in arvoreDeMetas?.[values.meta_id]?.iniciativas"
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
              loading: chamadasPendentes.arvoreDeMetas
            }"
            :disabled="!arvoreDeMetas?.[values.meta_id]?.[values.iniciativa_id]?.atividades.length"
          >
            <option :value="null">
              Selecionar
            </option>
            <option
              v-for="item in arvoreDeMetas?.[values.meta_id]?.[values.iniciativa_id]?.atividades"
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
        class="flex flexwrap g2"
      >
        <div class="f1 mb1">
          <LabelFromYup
            :schema="schema"
            name="origem_outro"
            class="tc300"
          >
            Descrição&nbsp;<span class="tvermelho">*</span>
          </LabelFromYup>
          <SmaeText
            name="origem_outro"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :schema="schema"
            maxlength="2048"
            :model-value="values.origem_outro"
            anular-vazio
            :class="{ 'error': errors.origem_outro }"
          />
          <ErrorMessage
            name="origem_outro"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <CampoDePlanosMetasRelacionados
      :apenas-pdms="false"
      :titulo="schema.fields.origens_extra.spec.label"
      etiqueta-botao-adicao="Adicionar origem"
      :model-value="values.origens_extra"
      :valores-iniciais="itemParaEdicao.origens_extra"
      name="origens_extra"
      class="mb2"
    >
      <template #rodape>
        <ErrorMessage
          class="error-msg"
          name="origens_extra"
        />
      </template>
    </CampoDePlanosMetasRelacionados>

    <fieldset>
      <div class="flex flexwrap g2">
        <div class="f1 mb1">
          <LabelFromYup
            name="previsao_inicio"
            :schema="schema"
          />
          <Field
            name="previsao_inicio"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.previsao_inicio }"
            maxlength="10"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('previsao_inicio', $v || null); }"
          />
          <ErrorMessage
            name="previsao_inicio"
            class="error-msg"
          />
        </div>
        <div class="f1 mb1">
          <LabelFromYup
            name="previsao_termino"
            :schema="schema"
          />
          <Field
            name="previsao_termino"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.previsao_termino }"
            maxlength="10"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('previsao_termino', $v || null); }"
          />
          <ErrorMessage
            name="previsao_termino"
            class="error-msg"
          />
        </div>

        <div class="f1 mb1">
          <LabelFromYup
            name="tolerancia_atraso"
            :schema="schema"
          />
          <Field
            name="tolerancia_atraso"
            type="number"
            min="0"
            max="100"
            class="inputtext light mb1"
            :disabled="emFoco?.n_filhos_imediatos > 0"
            :class="{ 'error': errors.tolerancia_atraso }"
            @update:model-value="values.tolerancia_atraso = Number(values.tolerancia_atraso)"
          />

          <ErrorMessage
            class="error-msg mb1"
            name="tolerancia_atraso"
          />
        </div>
      </div>

      <div
        v-show="projetoId"
        class="flex flexwrap g2"
      >
        <div class="f1 mb1">
          <LabelFromYup
            name="previsao_custo"
            :schema="schema"
          />
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
    </fieldset>

    <fieldset>
      <legend class="label mt2 mb1">
        Órgãos
      </legend>

      <div class="flex flexwrap g2">
        <div class="f1 mb1">
          <LabelFromYup
            class="tc300"
            name="orgao_gestor_id"
            :schema="schema"
          />
          <Field
            v-if="!projetoId"
            name="orgao_gestor_id"
            as="select"
            class="inputtext light mb1"
            :class="{
              error: errors.orgao_gestor_id,
              loading: ÓrgãosStore.organs.loading,
            }"
            :disabled="!orgaosDisponiveisPorPortolio[values.portfolio_id]?.length"
            @change="setFieldValue('responsaveis_no_orgao_gestor', [])"
          >
            <option :value="0">
              Selecionar
            </option>
            <option
              v-for="item in orgaosDisponiveisPorPortolio[values.portfolio_id] || []"
              :key="item.id"
              :value="item.id"
              :disabled="!possíveisGestoresPorÓrgãoId[item.id]?.length"
              :title="item.descricao?.length > 36 ? item.descricao : null"
            >
              {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
            </option>
          </Field>
          <input
            v-else
            type="text"
            :value="emFoco.orgao_gestor.sigla + ' - ' + truncate(emFoco.orgao_gestor.descricao, 36)"
            class="inputtext light mb1"
            :title="emFoco.orgao_gestor.descricao?.length > 36
              ? emFoco.orgao_gestor.descricao
              : null"
            disabled
          >
          <ErrorMessage
            name="orgao_gestor_id"
            class="error-msg"
          />
        </div>

        <div class="f1 mb1">
          <LabelFromYup
            name="responsaveis_no_orgao_gestor"
            :schema="schema"
            class="tc300"
          />

          <AutocompleteField
            name="responsaveis_no_orgao_gestor"
            :controlador="{
              busca: '',
              participantes: values.responsaveis_no_orgao_gestor || []
            }"
            :grupo="possíveisGestoresPorÓrgãoId[values.orgao_gestor_id]
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

      <div class="flex flexwrap g2">
        <div class="f1 mb1">
          <LabelFromYup
            name="orgao_responsavel_id"
            :schema="schema"
            class="tc300"
          />
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
            @update:model-value="values.orgao_responsavel_id = Number(values.orgao_responsavel_id)
              || null"
          >
            <option :value="0">
              Selecionar
            </option>
            <option
              v-for="item in órgãosQueTemResponsáveis"
              :key="item"
              :value="item.id"
              :disabled="!possíveisResponsáveisPorÓrgãoId[item.id]?.length"
              :title="item.descricao?.length > 36 ? item.descricao : null"
            >
              {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
            </option>
          </Field>
          <ErrorMessage
            name="orgao_responsavel_id"
            class="error-msg"
          />
        </div>

        <div class="f1 mb1">
          <LabelFromYup
            :schema="schema"
            name="responsavel_id"
            class="tc300"
          />
          <Field
            name="responsavel_id"
            as="select"
            class="inputtext light mb1"
            :class="{
              error: errors.responsavel_id,
              loading: portfolioStore.chamadasPendentes.lista
            }"
            :disabled="!possíveisResponsáveisPorÓrgãoId[values.orgao_responsavel_id]?.length"
            @update:model-value="values.responsavel_id = Number(values.responsavel_id)
              || null"
          >
            <option :value="0">
              Selecionar
            </option>
            <option
              v-for="item in
                possíveisResponsáveisPorÓrgãoId[values.orgao_responsavel_id] || []"
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

      <div class="flex flexwrap g2">
        <div class="f1 mb1">
          <LabelFromYup
            name="orgaos_participantes"
            :schema="schema"
            class="tc300"
          />

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
            :grupo="órgãosComoLista"
            label="sigla"
          />
          <ErrorMessage
            name="orgaos_participantes"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <div
      v-show="projetoId"
      class="flex flexwrap g2"
    >
      <div class="f1 mb1">
        <LabelFromYup
          name="equipe"
          :schema="schema"
        />

        <CampoDePessoasComBuscaPorOrgao
          :model-value="values.equipe"
          :valores-iniciais="itemParaEdicao.equipe"
          name="equipe"
          :pessoas="possíveisColaboradores"
        />
        <ErrorMessage
          name="equipe"
          class="error-msg"
        />
      </div>
    </div>

    <pre v-ScrollLockDebug>values.equipe:{{ values.equipe }}</pre>

    <div
      v-if="projetoId"
      class="flex flexwrap g2 mb1"
    >
      <div class="f1 mb1">
        <LabelFromYup
          :schema="schema"
          name="secretario_responsavel"
        />
        <Field
          name="secretario_responsavel"
          type="text"
          class="inputtext light mb1"
          :disabled="!emFoco?.permissoes?.campo_secretario_executivo"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="secretario_responsavel"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          :schema="schema"
          name="secretario_executivo"
        />
        <Field
          name="secretario_executivo"
          type="text"
          class="inputtext light mb1"
          :disabled="!emFoco?.permissoes?.campo_secretario_responsavel"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="secretario_executivo"
        />
      </div>
    </div>

    <div
      v-show="projetoId"
      class="flex flexwrap g2"
    >
      <div
        :disabled="!emFoco?.permissoes?.campo_versao"
        class="f1 mb1"
      >
        <LabelFromYup
          name="versao"
          :schema="schema"
        />
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
        :disabled="!emFoco?.permissoes?.campo_data_aprovacao"
        class="f1 mb1"
      >
        <LabelFromYup
          name="data_aprovacao"
          :schema="schema"
        />
        <Field
          name="data_aprovacao"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.data_aprovacao }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('data_aprovacao', $v || null); }"
        />
        <ErrorMessage
          name="data_aprovacao"
          class="error-msg"
        />
      </div>
      <div
        :disabled="!emFoco?.permissoes?.campo_data_revisao"
        class="f1 mb1"
      >
        <LabelFromYup
          name="data_revisao"
          :schema="schema"
        />
        <Field
          name="data_revisao"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.data_revisao }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('data_revisao', $v || null); }"
        />
        <ErrorMessage
          name="data_revisao"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex flexwrap g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="grupo_portfolio"
          :schema="schema"
          class="tc300"
        />

        <AutocompleteField
          :disabled="gruposDeObservadoresPendentes.lista"
          name="grupo_portfolio"
          :controlador="{
            busca: '',
            participantes: values.grupo_portfolio || []
          }"
          :class="{
            error: erroNosGruposDeObservadores,
            loading: gruposDeObservadoresPendentes.lista
          }"
          :grupo="gruposDeObservadores"
          label="titulo"
        />
        <ErrorMessage
          name="grupo_portfolio"
          class="error-msg"
        />
        <ErrorComponent :erro="erroNosGruposDeObservadores" />
      </div>
    </div>

    <pre v-ScrollLockDebug>values.grupo_portfolio:{{ values.grupo_portfolio }}</pre>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :aria-busy="isSubmitting"
        :aria-disabled="Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>

  <router-view :portfólios-disponíveis="portfóliosDisponíveis" />
</template>
