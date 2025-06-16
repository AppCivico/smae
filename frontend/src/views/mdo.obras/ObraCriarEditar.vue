<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CampoDePessoasComBuscaPorOrgao from '@/components/CampoDePessoasComBuscaPorOrgao.vue';
import CampoDePlanosMetasRelacionados from '@/components/CampoDePlanosMetasRelacionados.vue';
import CampoDeRegioesAgrupadas from '@/components/CampoDeRegioesAgrupadas.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import MapaCampo from '@/components/geo/MapaCampo.vue';
import { obras as schema } from '@/consts/formSchemas';
import statusObras from '@/consts/statusObras';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useEmpreendimentosStore } from '@/stores/empreendimentos.store';
import { useEquipamentosStore } from '@/stores/equipamentos.store';
import { useEtiquetasStore } from '@/stores/etiquetaMdo.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useObrasStore } from '@/stores/obras.store';
import { useObservadoresStore } from '@/stores/observadores.store.ts';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useProgramaHabitacionalStore } from '@/stores/programaHabitacional.store';
import { useTiposDeIntervencaoStore } from '@/stores/tiposDeIntervencao.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const empreendimentosStore = useEmpreendimentosStore();
const gruposTematicosStore = useGruposTematicosStore();
const ÓrgãosStore = useOrgansStore();
const tiposDeIntervencaoStore = useTiposDeIntervencaoStore();
const DotaçãoStore = useDotaçãoStore();
const alertStore = useAlertStore();
const observadoresStore = useObservadoresStore('obra');
const portfolioMdoStore = usePortfolioObraStore();
const programaHabitacionalStore = useProgramaHabitacionalStore();
const obrasStore = useObrasStore();
const equipamentosStore = useEquipamentosStore();
const etiquetasStore = useEtiquetasStore();

const {
  lista: listaDeEmpreendimentos,
  chamadasPendentes: chamadasPendentesDeEmpreendimentos,
  erro: erroDeEmpreendimentos,
} = storeToRefs(empreendimentosStore);

const {
  lista: listaDeEquipamentos,
  chamadasPendentes: chamadasPendentesDeEquipamentos,
  erro: erroDeEquipamentos,
} = storeToRefs(equipamentosStore);

const {
  lista: listaDeEtiquetas,
  chamadasPendentes: chamadasPendentesDeEtiquetas,
  erro: erroDeEtiquetas,
} = storeToRefs(etiquetasStore);

const {
  lista: listaDeGruposTemáticos,
  chamadasPendentes: chamadasPendentesDeGruposTemáticos,
  erro: erroDeGrupoTemático,
  gruposTemáticosPorId,
} = storeToRefs(gruposTematicosStore);

const {
  lista: listaDeProgramasHabitacionais,
  chamadasPendentes: chamadasPendentesDeProgramasHabitacionais,
  erro: erroDeProgramasHabitacional,
} = storeToRefs(programaHabitacionalStore);

const {
  lista: listaDeTiposDeIntervenção,
  chamadasPendentes: chamadasPendentesDeTiposDeIntervenção,
  erro: erroDeTiposDeIntervenção,
} = storeToRefs(tiposDeIntervencaoStore);

const {
  lista: gruposDeObservadores,
  chamadasPendentes: gruposDeObservadoresPendentes,
  erro: erroNosDadosDeObservadores,
} = storeToRefs(observadoresStore);

const {
  chamadasPendentes,
  emFoco,
  erro,
  geolocalizaçãoPorToken,
  itemParaEdicao,
  pdmsSimplificados,
  pdmsPorId,
  planosAgrupadosPorTipo,
  arvoreDeMetas,
} = storeToRefs(obrasStore);
const {
  órgãosComoLista,
  órgãosQueTemResponsáveis,
  órgãosQueTemResponsáveisEPorId,
} = storeToRefs(ÓrgãosStore);

const { DotaçãoSegmentos } = storeToRefs(DotaçãoStore);

const router = useRouter();
const route = useRoute();

const props = defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
});

const portfolioId = Number.parseInt(route.query.portfolio_id, 10) || undefined;
const possíveisGestores = ref([]);
const possíveisColaboradores = ref([]);

const portfóliosDisponíveis = computed(() => {
  if (!emFoco.value?.portfolio_id) {
    return [];
  }

  const órgãosDoPortfólioCorrente = portfolioMdoStore.portfoliosPorId[emFoco.value.portfolio_id]
    ?.orgaos.map((x) => x.id) || [];

  return portfolioMdoStore.lista
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

const orgaosDisponiveisPorPortolio = computed(() => portfolioMdoStore.lista.reduce((acc, cur) => {
  acc[cur.id] = cur.orgaos.filter((x) => !!órgãosQueTemResponsáveisEPorId.value?.[x.id]) || [];
  return acc;
}, {}));

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

const {
  errors,
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

function alertarTrocaDeStatus() {
  if (!!itemParaEdicao.value.status && itemParaEdicao.value.status !== values.status) {
    alertStore.success('Lembre-se de atualizar a etapa do cronograma. Para isso acesse a página Cronograma e atualize a etapa por meio do botão "Mudar etapa".');
  }
}

function BuscarDotaçãoParaAno(valorOuEvento) {
  const ano = valorOuEvento.target?.value || valorOuEvento;

  if (!DotaçãoSegmentos?.value?.[ano]) {
    DotaçãoStore.getDotaçãoSegmentos(ano);
  }
}

async function buscarArvoreDeMetas(valorOuEvento) {
  const idDaMeta = valorOuEvento.target?.value || valorOuEvento;

  if (idDaMeta && !arvoreDeMetas.value?.[idDaMeta]) {
    await obrasStore.buscarArvoreDeMetas({ meta_ids: idDaMeta });
  }
}

async function buscarPossíveisGestores() {
  try {
    const { linhas } = await requestS.get(`${baseUrl}/pessoa/reduzido`, { mdo_gestor_de_projeto: true });

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
    const { linhas } = await requestS.get(`${baseUrl}/pessoa/reduzido`, { mdo_colaborador_de_projeto: true });

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
  const cargaManipulada = nulificadorTotal(carga);

  switch (true) {
    case !!cargaManipulada.atividade_id:
      cargaManipulada.iniciativa_id = undefined;
      cargaManipulada.meta_id = undefined;
      break;

    case !!cargaManipulada.iniciativa_id:
      cargaManipulada.meta_id = undefined;
      cargaManipulada.atividade_id = undefined;
      break;

    case !!cargaManipulada.meta_id:
      cargaManipulada.atividade_id = undefined;
      cargaManipulada.iniciativa_id = undefined;
      break;

    default:
      break;
  }

  if (cargaManipulada.pdm_escolhido) {
    cargaManipulada.pdm_escolhido = undefined;
  }

  try {
    const msg = props.obraId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.obraId
      ? await obrasStore.salvarItem(cargaManipulada, props.obraId)
      : await obrasStore.salvarItem(cargaManipulada);

    if (resposta) {
      alertStore.success(msg);
      emFoco.value = null;
      if (resposta.id) {
        obrasStore.buscarItem(props.obraId || resposta.id);
        router.push({
          name: route.meta.rotaDeEscape,
          params: {
            obraId: resposta.id,
          },
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function iniciar() {
  if (!props.obraId) {
    obrasStore.$reset();
  }

  buscarPossíveisGestores();
  buscarPossíveisColaboradores();
  obrasStore.buscarPdms({ apenas_pdm: false });

  if (!listaDeEmpreendimentos.length && !chamadasPendentesDeEmpreendimentos.lista) {
    empreendimentosStore.buscarTudo();
  }

  if (!portfolioMdoStore.lista.length && !portfolioMdoStore.chamadasPendentes.lista) {
    portfolioMdoStore.buscarTudo();
  }

  if (!listaDeEquipamentos.length && !chamadasPendentesDeEquipamentos.lista) {
    equipamentosStore.buscarTudo();
  }

  if (!listaDeEtiquetas.length && !chamadasPendentesDeEtiquetas.lista) {
    etiquetasStore.buscarTudo();
  }

  if (!listaDeGruposTemáticos.length && !chamadasPendentesDeGruposTemáticos.lista) {
    gruposTematicosStore.buscarTudo();
  }

  if (!listaDeProgramasHabitacionais.length && !chamadasPendentesDeProgramasHabitacionais.lista) {
    programaHabitacionalStore.buscarTudo();
  }

  if (!listaDeTiposDeIntervenção.length && !chamadasPendentesDeTiposDeIntervenção.lista) {
    tiposDeIntervencaoStore.buscarTudo();
  }

  if (!gruposDeObservadores.length && !gruposDeObservadoresPendentes.lista) {
    observadoresStore.buscarTudo();
  }

  // Aqui por causa de alguma falha de reatividade apenas nesse store
  ÓrgãosStore.$reset();

  ÓrgãosStore.getAllOrganResponsibles().finally(() => {
    chamadasPendentes.value.emFoco = false;
  });

  if (emFoco.value?.meta_id) {
    buscarArvoreDeMetas(emFoco.value?.meta_id);
  }
}

function excluirObra(id, nome) {
  useAlertStore().confirmAction(`Deseja mesmo remover "${nome}"?`, async () => {
    if (await obrasStore.excluirItem(id)) {
      obrasStore.$reset();
      obrasStore.buscarTudo();
      useAlertStore().success('Obra removida.');

      // essa é uma exceção. Há duas rotas de escape possíveis:
      // - após a criação / edição de uma obra
      // - após a sua exclusão
      router.push({ name: 'obrasListar' });
    }
  }, 'Remover');
}

const formularioSujo = useIsFormDirty();

watch(emFoco, () => {
  iniciar();
}, { immediate: true });

watch(itemParaEdicao, (novoValor) => {
  resetForm({
    initialValues: novoValor,
  });
});

watch(listaDeTiposDeIntervenção, () => {
  // redefinir o formulário porque um atraso na carga da lista de intervenções
  // pode sujá-lo. Vamos tomar o cuidado de manter os dados já preenchidos.
  nextTick(() => {
    resetForm({
      values: {
        ...values,
        tipo_intervencao_id: itemParaEdicao.value.tipo_intervencao_id,
      },
    });
  });
});
</script>
<template>
  <header class="flex flexwrap spacebetween g1 center mb2">
    <h1 class="mb0">
      {{ emFoco?.nome || (obraId ? 'Obra' : 'Nova obra') }}
    </h1>

    <hr class="f1">
    <!--
  <MenuDeMudançaDeStatusDeProjeto
      class="ml2"
    v-if="obraId"
  />
-->
    <CheckClose :formulario-sujo="formularioSujo" />
  </header>

  <form
    v-if="!obraId || emFoco"
    @submit.prevent="!isSubmitting ? onSubmit() : null"
  >
    <div class="flex flexwrap g2 mb1">
      <div class="f1 mb1 fb20em">
        <LabelFromYup
          name="portfolio_id"
          :schema="schema"
        >
        <!--
          <template #append>
            <router-link
              v-if="portfóliosDisponíveis.length"
              :to="{
                name: 'obrasTrocarPortfolio'
              }"
              class="ml05 tipinfo"
              aria-label="Trocar de portfólio"
            >
              <svg
                width="10"
                height="10"
              ><use xlink:href="#i_edit" /></svg><div>Trocar de portfólio</div>
            </router-link>
          </template>
        -->
        </LabelFromYup>
        <Field
          name="portfolio_id"
          as="select"
          class="inputtext light mb1"
          :aria-busy="portfolioMdoStore.chamadasPendentes.lista"
          :class="{ error: errors.portfolio_id }"
          :disabled="!!portfolioId || !!obraId"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in portfolioMdoStore.lista"
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

      <div class="f1 mb1 fb20em">
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
        v-if="obraId"
        class="f1 mb1 fb10em"
      >
        <label
          for="codigo"
          class="label"
        >
          Código
        </label>
        <input
          id="codigo"
          type="text"
          :value="emFoco?.codigo"
          class="inputtext light mb1"
          disabled
        >
      </div>

      <div
        class="f1 mb1 fb10em"
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
          @change.once="alertarTrocaDeStatus"
        >
          <option
            :value="null"
            disabled
          >
            Selecionar
          </option>
          <option
            v-for="item in statusObras"
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

    <div class="flex flexwrap g2 mb1">
      <div class="f2 mb1 fb15em">
        <LabelFromYup
          name="tags"
          :schema="schema"
        />

        <AutocompleteField
          name="tags"
          :controlador="{
            busca: '',
            participantes: values.tags || []
          }"
          :grupo="listaDeEtiquetas || []"
          :aria-busy="etiquetasStore.chamadasPendentes.lista"
          :class="{
            error: errors.tags,
          }"
          label="descricao"
        />
        <ErrorMessage
          name="tags"
          class="error-msg"
        />
        <ErrorComponent
          :erro="erroDeEtiquetas"
        />
      </div>

      <div class="f1 mb1 fb15em">
        <LabelFromYup
          name="grupo_tematico_id"
          :schema="schema"
        />
        <Field
          name="grupo_tematico_id"
          as="select"
          class="inputtext light mb1"
          :aria-busy="chamadasPendentesDeGruposTemáticos.lista"
          :class="{ 'error': errors.grupo_tematico_id }"
          @change="() => {
            resetField('programa_id', { value: null });
            resetField('mdo_n_unidades_habitacionais', { value: null });
            resetField('mdo_n_familias_beneficiadas', { value: null });
          }"
          @update:model-value="($v) => {
            setFieldValue('mdo_n_familias_beneficiadas', Number($v) || null);
          }"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in listaDeGruposTemáticos"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="grupo_tematico_id"
          class="error-msg"
        />
        <ErrorComponent
          :erro="erroDeGrupoTemático.lista"
        />
      </div>
      <div class="f1 mb1 fb15em">
        <LabelFromYup
          name="equipamento_id"
          :schema="schema"
        />
        <Field
          name="equipamento_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.equipamento_id }"
          :aria-busy="chamadasPendentesDeEquipamentos.lista"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in listaDeEquipamentos"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="equipamento_id"
          class="error-msg"
        />
        <ErrorComponent
          :erro="erroDeEquipamentos.lista"
        />
      </div>
    </div>

    <div class="flex flexwrap g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="orgao_origem_id"
          :schema="schema"
        />
        <Field
          name="orgao_origem_id"
          as="select"
          class="inputtext light mb1"
          :aria-busy="ÓrgãosStore.organs.loading"
          :class="{
            error: errors.orgao_origem_id,
          }"
          :disabled="!!obraId || !órgãosComoLista.length"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in órgãosComoLista || []"
            :key="item.id"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>
        <ErrorMessage
          name="orgao_origem_id"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="orgao_executor_id"
          :schema="schema"
        />
        <Field
          name="orgao_executor_id"
          as="select"
          class="inputtext light mb1"
          :aria-busy="ÓrgãosStore.organs.loading"
          :class="{
            error: errors.orgao_executor_id,
          }"
          :disabled="!órgãosComoLista.length"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in órgãosComoLista || []"
            :key="item.id"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>
        <ErrorMessage
          name="orgao_executor_id"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="empreendimento_id"
          :schema="schema"
        />
        <Field
          name="empreendimento_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.empreendimento_id,
          }"
          :disabled="!listaDeEmpreendimentos.length"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in listaDeEmpreendimentos || []"
            :key="item.id"
            :value="item.id"
            :title="item.nome"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="empreendimento_id"
          class="error-msg"
        />
        <ErrorComponent
          :erro="erroDeEmpreendimentos"
        />
      </div>
    </div>

    <div class="f1 mb1 fb15em">
      <LabelFromYup
        name="tipo_intervencao_id"
        :schema="schema"
        class="mb1"
      />

      <LoadingComponent v-if="chamadasPendentesDeTiposDeIntervenção.lista" />

      <ul
        v-else
        class="lista-de-perfis t12"
      >
        <li
          v-for="item in listaDeTiposDeIntervenção"
          :key="item.id"
          class="lista-de-perfis__item mb2"
        >
          <label
            class="block mb1 perfil"
            :for="`tipo_intervencao_id_${item.id}`"
          >
            <Field
              :id="`tipo_intervencao_id_${item.id}`"
              type="radio"
              :value="item.id"
              name="tipo_intervencao_id"
              class="perfil__campo inputcheckbox"
            />
            {{ item.nome }}
            <small class="block t12 tc500 w700 mt05">
              {{ item.conceito }}
            </small>
          </label>
        </li>
      </ul>
      <ErrorMessage
        name="tipo_intervencao_id"
        class="error-msg"
      />
      <ErrorComponent
        :erro="erroDeTiposDeIntervenção.lista"
      />
    </div>
    <div
      v-if="obraId"
      class="mb2"
    >
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
          loading: portfolioMdoStore.chamadasPendentes.lista
        }"
        label="titulo"
      />
      <ErrorMessage
        name="portfolios_compartilhados"
        class="error-msg"
      />
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="mdo_detalhamento"
          :schema="schema"
        />
        <Field
          v-slot="{ field, handleChange, value }"
          name="mdo_detalhamento"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ 'error': errors.mdo_detalhamento }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>
        <ErrorMessage
          name="mdo_detalhamento"
          class="error-msg"
        />
      </div>
    </div>

    <div
      v-if="gruposTemáticosPorId[values.grupo_tematico_id]?.programa_habitacional
        || gruposTemáticosPorId[values.grupo_tematico_id]?.unidades_habitacionais
        || gruposTemáticosPorId[values.grupo_tematico_id]?.familias_beneficiadas
        || gruposTemáticosPorId[values.grupo_tematico_id]?.unidades_atendidas"
      class="flex flexwrap g2 mb1"
    >
      <div
        v-if="gruposTemáticosPorId[values.grupo_tematico_id]?.programa_habitacional"
        class="f1 mb1"
      >
        <LabelFromYup
          name="programa_id"
          :schema="schema"
        />
        <Field
          name="programa_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.programa_id }"
          :aria-busy="chamadasPendentesDeProgramasHabitacionais.lista"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in listaDeProgramasHabitacionais"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>

        <ErrorMessage
          name="programa_id"
          class="error-msg"
        />

        <ErrorComponent
          :erro="erroDeProgramasHabitacional"
        />
      </div>
      <div
        v-if="gruposTemáticosPorId[values.grupo_tematico_id]?.unidades_habitacionais"
        class="f1 mb1 fb5em"
      >
        <LabelFromYup
          name="mdo_n_unidades_habitacionais"
          :schema="schema"
        />

        <Field
          name="mdo_n_unidades_habitacionais"
          type="number"
          class="inputtext light mb1"
          :class="{ 'error': errors.mdo_n_unidades_habitacionais }"
        />
        <ErrorMessage
          name="mdo_n_unidades_habitacionais"
          class="error-msg"
        />
      </div>
      <div
        v-if="gruposTemáticosPorId[values.grupo_tematico_id]?.unidades_atendidas"
        class="f1 mb1 fb5em"
      >
        <LabelFromYup
          name="mdo_n_unidades_atendidas"
          :schema="schema"
        />
        <Field
          name="mdo_n_unidades_atendidas"
          type="number"
          class="inputtext light mb1"
          :class="{ 'error': errors.mdo_n_unidades_atendidas }"
        />
        <ErrorMessage
          name="mdo_n_unidades_atendidas"
          class="error-msg"
        />
      </div>
      <div
        v-if="gruposTemáticosPorId[values.grupo_tematico_id]?.familias_beneficiadas"
        class="f1 mb1 fb5em"
      >
        <LabelFromYup
          name="mdo_n_familias_beneficiadas"
          :schema="schema"
        />

        <Field
          name="mdo_n_familias_beneficiadas"
          type="number"
          class="inputtext light mb1"
          :class="{ 'error': errors.mdo_n_familias_beneficiadas }"
        />
        <ErrorMessage
          name="mdo_n_familias_beneficiadas"
          class="error-msg"
        />
      </div>
    </div>

    <fieldset class="mb2">
      <LabelFromYup
        name="regiao_ids"
        as="legend"
        :schema="schema"
      />

      <CampoDeRegioesAgrupadas
        v-model="values.regiao_ids"
        :valores-iniciais="itemParaEdicao.regiao_ids"
        :nível="portfolioMdoStore.portfoliosPorId[values.portfolio_id]?.nivel_regionalizacao"
      />
    </fieldset>

    <fieldset class="mb2">
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
            Programa de metas&nbsp;<span class="tvermelho">*</span>
          </label>
          <Field
            name="pdm_escolhido"
            as="select"
            class="inputtext light mb1"
            :aria-busy="chamadasPendentes.pdmsSimplificado"
            :class="{
              error: errors.pdm_escolhido,
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
            :aria-busy="chamadasPendentes.arvoreDeMetas"
            :class="{
              error: errors.iniciativa_id,
            }"
            :disabled="
              !arvoreDeMetas?.[values.meta_id]?.iniciativas
                || !Object.keys(arvoreDeMetas?.[values.meta_id]?.iniciativas).length
            "
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
            :aria-busy="chamadasPendentes.arvoreDeMetas"
            :class="{
              error: errors.atividade_id,
            }"
            :disabled="
              !arvoreDeMetas?.[values.meta_id]?.iniciativas?.[values.iniciativa_id]?.atividades
                || !Object.keys(arvoreDeMetas?.[values.meta_id]
                  ?.iniciativas?.[values.iniciativa_id]?.atividades).length
            "
          >
            <option :value="null">
              Selecionar
            </option>
            <option
              v-for="
                item in arvoreDeMetas
                  ?.[values.meta_id]?.iniciativas?.[values.iniciativa_id]?.atividades
              "
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

    <div
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
        <div class="f1 mb1">
          <LabelFromYup
            name="mdo_previsao_inauguracao"
            :schema="schema"
          />
          <Field
            name="mdo_previsao_inauguracao"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.mdo_previsao_inauguracao }"
            maxlength="10"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('mdo_previsao_inauguracao', $v || null); }"
          />
          <ErrorMessage
            name="mdo_previsao_inauguracao"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap g2">
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

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="mdo_observacoes"
          :schema="schema"
        />
        <Field
          v-slot="{ field, handleChange, value }"
          name="mdo_observacoes"
        >
          <SmaeText
            :name="field.name"
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :schema="schema"
            :model-value="value"
            anular-vazio
            :class="{ 'error': errors.mdo_observacoes }"
            @update:model-value="handleChange"
          />
        </Field>
        <ErrorMessage
          name="mdo_observacoes"
          class="error-msg"
        />
      </div>
    </div>

    <fieldset>
      <legend>
        Órgãos
      </legend>

      <div class="flex flexwrap g2 mb1">
        <div class="f1 mb1 fb15em">
          <LabelFromYup
            name="orgao_gestor_id"
            :schema="schema"
          />
          <Field
            name="orgao_gestor_id"
            as="select"
            class="inputtext light mb1"
            :aria-busy="ÓrgãosStore.organs.loading"
            :class="{
              error: errors.orgao_gestor_id,
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

          <ErrorMessage
            name="orgao_gestor_id"
            class="error-msg"
          />
        </div>

        <div class="f2 mb1 fb15em">
          <LabelFromYup
            name="responsaveis_no_orgao_gestor"
            :schema="schema"
          />

          <AutocompleteField
            name="responsaveis_no_orgao_gestor"
            :controlador="{
              busca: '',
              participantes: values.responsaveis_no_orgao_gestor || []
            }"
            :grupo="possíveisGestoresPorÓrgãoId[values.orgao_gestor_id]
              || []"
            :aria-busy="portfolioMdoStore.chamadasPendentes.lista"
            :class="{
              error: errors.responsaveis_no_orgao_gestor,
            }"
            label="nome_exibicao"
          />
          <ErrorMessage
            name="responsaveis_no_orgao_gestor"
            class="error-msg"
          />
        </div>

        <div class="f2 mb1 fb15em">
          <LabelFromYup
            :schema="schema"
            name="secretario_executivo"
          />
          <Field
            name="secretario_executivo"
            type="text"
            class="inputtext light mb1"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="secretario_executivo"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1 mb1 fb15em">
          <LabelFromYup
            name="orgao_responsavel_id"
            :schema="schema"
          />
          <Field
            name="orgao_responsavel_id"
            as="select"
            class="inputtext light mb1"
            :class="{
              error: errors.orgao_responsavel_id,
            }"
            :disabled="!órgãosQueTemResponsáveis?.length"
            @change="setFieldValue('responsavel_id', 0)"
            @update:model-value="($v) => {
              setFieldValue('orgao_responsavel_id', Number($v) || null);
            }"
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

        <div class="f2 mb1 fb15em">
          <LabelFromYup
            name="responsavel_id"
            :schema="schema"
          />
          <Field
            name="responsavel_id"
            as="select"
            class="inputtext light mb1"
            :aria-busy="portfolioMdoStore.chamadasPendentes.lista"
            :class="{
              error: errors.responsavel_id,
            }"
            :disabled="!possíveisResponsáveisPorÓrgãoId[values.orgao_responsavel_id]?.length"
            @update:model-value="($v) => {
              setFieldValue('responsavel_id', Number($v) || null);
            }"
          >
            <option :value="0">
              Selecionar
            </option>
            <option
              v-for="item in possíveisResponsáveisPorÓrgãoId[values.orgao_responsavel_id]"
              :key="item"
              :value="item.id"
              :title="item.descricao?.length > 36 ? item.descricao : null"
            >
              {{ item.nome_exibicao }}
            </option>
          </Field>
          <ErrorMessage
            name="responsavel_id"
            class="error-msg"
          />
        </div>

        <div class="f2 mb1 fb15em">
          <LabelFromYup
            :schema="schema"
            name="secretario_responsavel"
          />
          <Field
            name="secretario_responsavel"
            type="text"
            class="inputtext light mb1"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="secretario_responsavel"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <CampoDePessoasComBuscaPorOrgao
          :model-value="values.colaboradores_no_orgao"
          :valores-iniciais="itemParaEdicao.colaboradores_no_orgao"
          name="colaboradores_no_orgao"
          :orgao-label="schema.fields.colaboradores_no_orgao.spec.label"
          :pessoas-label="schema.fields.ponto_focal_colaborador.spec.label"
          :pessoas="possíveisResponsáveisPorÓrgãoId[values.orgao_colaborador_id] || []"
          :pessoa-informativo="schema.fields.colaboradores_no_orgao.meta().balaoInformativo"
        />
      </div>
    </fieldset>

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
          error: erroNosDadosDeObservadores,
          loading: gruposDeObservadoresPendentes.lista
        }"
        :grupo="gruposDeObservadores"
        label="titulo"
      />

      <ErrorMessage
        name="grupo_portfolio"
        class="error-msg"
      />

      <ErrorComponent
        :erro="erroNosDadosDeObservadores"
      />
    </div>

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

  <LoadingComponent
    v-if="chamadasPendentes?.emFoco"
  />

  <button
    v-if="emFoco?.id && !emFoco?.permissoes?.apenas_leitura"
    class="btn amarelo big"
    @click="excluirObra(emFoco.id)"
  >
    Remover item
  </button>

  <ErrorComponent
    v-if="erro"
  >
    {{ erro }}
  </ErrorComponent>

  <router-view :portfólios-disponíveis="portfóliosDisponíveis" />
</template>
