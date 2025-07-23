<script setup>
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
  computed, onUnmounted, ref, watch,
} from 'vue';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import SmaeMonth from '@/components/camposDeFormulario/SmaeMonth';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import AgrupadorDeAutocomplete from '@/components/AgrupadorDeAutocomplete.vue';
import escaparDaRota from '@/helpers/escaparDaRota';
import { variavelGlobal as schemaCriacao, variavelGlobalParaGeracao as schemaGeracao } from '@/consts/formSchemas';
import niveisRegionalizacao from '@/consts/niveisRegionalizacao';
import periodicidades from '@/consts/periodicidades';
import polaridadeDeVariaveis from '@/consts/polaridadeDeVariaveis';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useAssuntosStore } from '@/stores/assuntosPs.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useFontesStore } from '@/stores/fontesPs.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useRegionsStore } from '@/stores/regions.store';
import { useResourcesStore } from '@/stores/resources.store';
import { useUsersStore } from '@/stores/users.store';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store.ts';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';

const alertStore = useAlertStore();

const assuntosStore = useAssuntosStore();
const {
  lista: listaDeAssuntos,
  categorias: listaDeCategorias,
  chamadasPendentes: chamadasPendentesDeAssuntos,
  erro: erroDeAssuntos,
} = storeToRefs(assuntosStore);

const authStore = useAuthStore();
const { temPermissãoPara, user } = storeToRefs(authStore);

const fontesStore = useFontesStore();
const {
  lista: listaDeFontes,
  chamadasPendentes: chamadasPendentesDeFontes,
} = storeToRefs(fontesStore);

const equipesStore = useEquipesStore();
const {
  equipesPorOrgaoIdPorPerfil,
  chamadasPendentes: chamadasPendentesDeEquipes,
} = storeToRefs(equipesStore);

const ÓrgãosStore = useOrgansStore();
const { organs, órgãosComoLista } = storeToRefs(ÓrgãosStore);

const usersStore = useUsersStore();

const RegionsStore = useRegionsStore();
const { regions, regiõesPorNívelOrdenadas } = storeToRefs(RegionsStore);

const resourcesStore = useResourcesStore();
const { resources } = storeToRefs(resourcesStore);

const variaveisCategoricasStore = useVariaveisCategoricasStore();
const {
  variaveisPositivas: listaDeVariaveisCategoricas,
  chamadasPendentes: chamadasPendentesDeVariaveisCategoricas,
  variaveisPorId: variaveisCategoricasPorId,
} = storeToRefs(variaveisCategoricasStore);

const variaveisGlobaisStore = useVariaveisGlobaisStore();
const {
  chamadasPendentes,
  emFoco,
  erros,
  itemParaEdicao,
} = storeToRefs(variaveisGlobaisStore);

const props = defineProps({
  variavelId: {
    type: [
      Number,
    ],
    default: 0,
  },
});

const router = useRouter();
const route = useRoute();

const gerarMultiplasVariaveis = ref(false);

const schema = computed(() => (gerarMultiplasVariaveis.value
  ? schemaGeracao
  : schemaCriacao
));

const {
  errors, handleSubmit, resetForm, resetField, values, validateField, setFieldValue,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema.value,
});

const agrupadorSelecionado = computed(() => itemParaEdicao.value.assuntos_mapeados);

const estãoTodasAsRegiõesSelecionadas = computed({
  get: () => {
    if (!values.regioes) {
      return false;
    }

    return values.regioes?.length === regiõesPorNívelOrdenadas
      .value?.[values.nivel_regionalizacao]?.length;
  },
  set: (valor) => {
    if (valor) {
      resetField(
        'regioes',
        {
          value: regiõesPorNívelOrdenadas.value?.[values.nivel_regionalizacao]?.map((r) => r.id),
        },
      );
    } else {
      resetField(
        'regioes',
        {
          value: [],
        },
      );
    }
  },
});

const orgaosDisponiveis = computed(() => (temPermissãoPara.value('CadastroVariavelGlobal.administrador')
  ? órgãosComoLista.value
  : órgãosComoLista.value.filter((orgao) => orgao.id === user.value.orgao_id)));

const ehNumerica = computed(() => values.variavel_categorica_id === '' || !values.variavel_categorica_id);

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const cargaManipulada = nulificadorTotal(valoresControlados);

  let msg = props.variavelId
    ? `Variável "${cargaManipulada.titulo}" salva!`
    : `Variável "${cargaManipulada.titulo}" adicionada!`;
  let resposta;

  if (gerarMultiplasVariaveis.value) {
    msg = 'Múltiplas variáveis geradas!';
    resposta = await variaveisGlobaisStore.gerarItens(cargaManipulada);
  } else {
    resposta = await variaveisGlobaisStore.salvarItem(cargaManipulada, props.variavelId);
  }

  try {
    if (resposta) {
      alertStore.success(msg);
      if (route.params.variavelId) {
        escaparDaRota(router);
      } else {
        escaparDaRota(router, {
          query: {
            ordem_coluna: 'criado_em',
            ordem_direcao: 'desc',
          },
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const formularioSujo = useIsFormDirty();

async function iniciar() {
  ÓrgãosStore.getAll();
  assuntosStore.buscarTudo();
  assuntosStore.buscarCategorias();
  fontesStore.buscarTudo();
  equipesStore.buscarTudo();
  usersStore.buscarPessoasSimplificadas({ ps_admin_cp: true });
  variaveisCategoricasStore.buscarTudo();

  if (!regions.length) {
    RegionsStore.getAll();
  }

  if (!resources.length) {
    resourcesStore.getAll();
  }
}

function redefinirCamposDeGrupos(campo) {
  resetField(`${campo}_grupo_ids`, { value: [] });
}

iniciar();

watch(itemParaEdicao, (novoValor) => {
  resetForm({
    initialValues: novoValor,
  });
}/* , { immediate: true } */);

watch(gerarMultiplasVariaveis, (novoValor) => {
  if (!novoValor) {
    resetField('sufixo', { value: null });
    resetField('criar_formula_composta', { value: null });
    resetField('nivel_regionalizacao', { value: null });
    resetField('regioes', { value: null });
  }
});

function limparCampoReferenteVariavelCategorica({ target }) {
  if (
    (target.value !== ''
    || target.value)
  ) {
    const fields = {
      unidade_medida_id: null,
      casas_decimais: 0,
      ano_base: null,
      valor_base: null,
      polaridade: null,
      acumulativa: false,
    };

    Object.entries(fields).forEach(([key, value]) => {
      setFieldValue(key, value);
      validateField(key);
    });
  }
}

function logicaMapeamentoDeOpcoesDeAssunto(selecionados, listaDeAgrupadores, listaDeItems) {
  const opcoes = selecionados.reduce((amount, linha) => {
    amount.push({
      listaDeAgrupadores,
      listaDeItems: listaDeItems.filter(
        (item) => item.categoria_assunto_variavel_id === linha.agrupadorId,
      ),
    });

    return amount;
  }, []);

  return opcoes;
}

onUnmounted(() => {
  // limpar por segurança, porque a lista não é "pura"
  usersStore.$reset();
});
</script>
<template>
  <CabecalhoDePagina
    class="mb2"
    :formulario-sujo="formularioSujo"
  />

  <form
    :aria-busy="chamadasPendentes.emFoco && !emFoco"
    @submit="onSubmit"
  >
    <fieldset>
      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb15em">
          <LabelFromYup
            name="orgao_proprietario_id"
            :schema="schema"
          />
          <Field
            name="orgao_proprietario_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.orgao_proprietario_id }"
            :aria-busy="organs.loading"
          >
            <option :value="null">
              Selecionar
            </option>

            <option
              v-for="item in orgaosDisponiveis"
              :key="item"
              :value="item.id"
              :title="item.descricao?.length > 36 ? item.descricao : null"
            >
              {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="orgao_proprietario_id"
          />
        </div>

        <div class="f1 fb15em">
          <LabelFromYup
            name="fonte_id"
            :schema="schema"
          />
          <Field
            name="fonte_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.fonte_id }"
            :aria-busy="chamadasPendentesDeFontes.lista"
          >
            <option :value="null">
              Selecionar
            </option>

            <option
              v-for="item in listaDeFontes"
              :key="item"
              :value="item.id"
              :title="item.descricao?.length > 36 ? item.descricao : null"
            >
              {{ item.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="fonte_id"
          />
        </div>

        <div
          v-if="variavelId"
          class="f1 fb15em"
        >
          <label
            for="codigo"
            class="label"
          >
            Código
          </label>
          <input
            id="codigo"
            name="codigo"
            type="text"
            class="inputtext light mb1"
            :class="{ error: errors.codigo }"
            :value="emFoco?.codigo"
            aria-disabled="true"
            readonly
          >
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="titulo"
            :schema="schema"
          />
          <Field
            name="titulo"
            type="text"
            class="inputtext light mb1"
            :class="{ error: errors.titulo }"
          />
          <ErrorMessage
            class="error-msg"
            name="titulo"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <div class="f1 mb1">
            <LabelFromYup
              name="descricao"
              :schema="schema"
            />

            <SmaeText
              name="descricao"
              :model-value="values.descricao"
              as="textarea"
              rows="5"
              anular-vazio
              class="inputtext light mb1"
              maxlength="500"
              :class="{ error: errors.descricao }"
            />

            <ErrorMessage
              name="descricao"
              class="error-msg"
            />
          </div>
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <div class="f1 mb1">
            <LabelFromYup
              name="metodologia"
              :schema="schema"
            />

            <SmaeText
              name="metodologia"
              :model-value="values.metodologia"
              as="textarea"
              rows="5"
              anular-vazio
              class="inputtext light mb1"
              maxlength="500"
              :class="{ error: errors.metodologia }"
            />

            <ErrorMessage
              name="metodologia"
              class="error-msg"
            />
          </div>
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap g2 mb1">
        <Field
          v-slot="{ field: { onChange } }"
          name="assuntos"
        >
          <AgrupadorDeAutocomplete
            :valores-iniciais="agrupadorSelecionado"
            class="f1"
            titulo="Assunto"
            name-principal="assuntos"
            label-campo-item="Assuntos"
            label-campo-agrupador="Categoria de Assuntos"
            :lista-de-items="listaDeAssuntos"
            :lista-de-agrupadores="listaDeCategorias"
            :logica-mapeamento-de-opcoes="logicaMapeamentoDeOpcoesDeAssunto"
            :class="{ error: erroDeAssuntos }"
            @update:model-value="onChange"
            @aria-busy="chamadasPendentesDeAssuntos.lista
              || chamadasPendentesDeAssuntos.categorias"
          />
        </Field>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb10em">
          <LabelFromYup
            name="variavel_categorica_id"
            :schema="schema"
          />
          <Field
            v-if="!variavelId"
            name="variavel_categorica_id"
            as="select"
            class="inputtext light mb1"
            :aria-disabled="!listaDeVariaveisCategoricas.length || !!variavelId"
            :aria-busy="chamadasPendentesDeVariaveisCategoricas.lista"
            :class="{ error: errors.variavel_categorica_id }"
            @change="limparCampoReferenteVariavelCategorica"
          >
            <option value="">
              Numérica
            </option>
            <optgroup label="Categórica">
              <option
                v-for="v, i in listaDeVariaveisCategoricas"
                :key="i"
                :value="v.id"
                :title="v.descricao"
              >
                {{ v.titulo }}
              </option>
            </optgroup>
          </Field>

          <input
            v-else
            readonly
            aria-disabled="true"
            :value="variaveisCategoricasPorId[emFoco?.variavel_categorica_id]?.titulo || 'Numérica'"
            class="inputtext light mb1"
          >

          <ErrorMessage
            class="error-msg"
            name="variavel_categorica_id"
          />
        </div>

        <div class="f1 fb10em">
          <LabelFromYup
            name="polaridade"
            :schema="schema"
          >
            {{ schema.fields.polaridade.spec.label }}
            <span
              class="tvermelho"
            >*</span>
          </LabelFromYup>
          <Field
            v-if="!variavelId"
            name="polaridade"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.polaridade }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="p, k in polaridadeDeVariaveis"
              :key="k"
              :value="p.valor"
            >
              {{ p.nome }}
            </option>
          </Field>

          <input
            v-else
            readonly
            aria-disabled="true"
            :value="values?.polaridade"
            class="inputtext light mb1"
          >

          <ErrorMessage
            class="error-msg"
            name="polaridade"
          />
        </div>
        <div
          v-if="ehNumerica"
          class="f2 fb15em"
        >
          <LabelFromYup
            name="unidade_medida_id"
            :schema="schema"
          >
            {{ schema.fields.unidade_medida_id.spec.label }}
            <span class="tvermelho">*</span>
          </LabelFromYup>
          <Field
            v-if="!variavelId"
            name="unidade_medida_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.unidade_medida_id }"
          >
            <option value="">
              Selecione
            </option>
            <option
              v-for="unidade in resources"
              :key="unidade.id"
              :value="unidade.id"
            >
              {{ unidade.sigla }} - {{ unidade.descricao }}
            </option>
          </Field>

          <input
            v-else
            readonly
            aria-disabled="true"
            :value="emFoco?.unidade_medida?.descricao"
            class="inputtext light mb1"
          >

          <ErrorMessage
            class="error-msg"
            name="unidade_medida_id"
          />
        </div>
        <div
          v-if="ehNumerica"
          class="f1 fb10em"
        >
          <LabelFromYup
            name="casas_decimais"
            :schema="schema"
          >
            {{ schema.fields.casas_decimais.spec.label }}
            <span class="tvermelho">*</span>
          </LabelFromYup>
          <Field
            name="casas_decimais"
            type="number"
            min="0"
            class="inputtext light mb1"
            :class="{ error: errors.casas_decimais }"
          />
          <ErrorMessage
            class="error-msg"
            name="casas_decimais"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div
          v-if="ehNumerica"
          class="f1 fb15em"
        >
          <LabelFromYup
            name="valor_base"
            :schema="schema"
          >
            {{ schema.fields.valor_base.spec.label }}
            <span class="tvermelho">*</span>
          </LabelFromYup>
          <MaskedFloatInput
            :value="values.valor_base"
            name="valor_base"
            class="inputtext light mb1"
            converter-para="string"
            :aria-disabled="!!variavelId"
            :standalone="!!variavelId"
            :readonly="!!variavelId"
            :class="{ error: errors.valor_base }"
          />
          <ErrorMessage
            class="error-msg"
            name="valor_base"
          />
        </div>
        <div
          v-if="ehNumerica"
          class="f1 fb15em"
        >
          <LabelFromYup
            name="ano_base"
            :schema="schema"
          />
          <Field
            v-if="!variavelId"
            name="ano_base"
            type="number"
            min="1900"
            class="inputtext light mb1"
            :class="{ error: errors.ano_base }"
          />
          <input
            v-else
            :value="emFoco?.ano_base"
            min="1900"
            class="inputtext light mb1"
            aria-disabled="true"
            readonly
          >
          <ErrorMessage
            class="error-msg"
            name="ano_base"
          />
        </div>

        <div class="f1 fb10em">
          <LabelFromYup
            name="periodicidade"
            :schema="schema"
          />
          <Field
            v-if="!variavelId"
            id="periodicidade"
            name="periodicidade"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.periodicidade }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="p, k in periodicidades.variaveis"
              :key="k"
              :value="p.valor"
            >
              {{ p.nome }}
            </option>
          </Field>
          <input
            v-else
            id="periodicidade"
            readonly
            aria-disabled="true"
            :value="values?.periodicidade"
            class="inputtext light mb1"
          >
          <ErrorMessage
            class="error-msg"
            name="periodicidade"
          />
        </div>

        <div class="f1 fb15em">
          <LabelFromYup
            name="inicio_medicao"
            :schema="schema"
          />
          <Field
            v-slot="{ value, handleChange }"
            name="inicio_medicao"
            class="inputtext light mb1"
            :class="{ error: errors.inicio_medicao }"
          >
            <SmaeMonth
              dia-prefixo="1"
              placeholder="MM/YYYY"
              :model-value="value"
              @change="handleChange"
            />
          </Field>

          <ErrorMessage
            class="error-msg"
            name="inicio_medicao"
          />
        </div>

        <div class="f1 fb15em">
          <LabelFromYup
            name="fim_medicao"
            :schema="schema"
          />

          <Field
            v-slot="{ value, handleChange }"
            name="fim_medicao"
            class="inputtext light mb1"
            :class="{ error: errors.fim_medicao }"
          >
            <SmaeMonth
              dia-prefixo="1"
              placeholder="MM/YYYY"
              :model-value="value"
              @change="handleChange"
            />
          </Field>

          <ErrorMessage
            class="error-msg"
            name="fim_medicao"
          />
        </div>

        <div class="f1 fb10em">
          <LabelFromYup
            name="atraso_meses"
            :schema="schema"
          />
          <Field
            name="atraso_meses"
            type="number"
            min="0"
            step="1"
            class="inputtext light mb1"
            :class="{ error: errors.atraso_meses }"
          />
          <ErrorMessage
            class="error-msg"
            name="atraso_meses"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="flex flexwrap g2 mb1">
      <div class="f1 fb25em">
        <div>
          <LabelFromYup
            name="medicao_orgao_id"
            :schema="schema"
          />
          <Field
            name="medicao_orgao_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.medicao_orgao_id }"
            :aria-busy="organs.loading"
            @change="redefinirCamposDeGrupos('medicao')"
          >
            <option
              v-for="orgao in órgãosComoLista"
              :key="orgao.id"
              :value="orgao.id"
              :title="orgao.descricao?.length > 36 ? orgao.descricao : null"
            >
              {{ orgao.sigla }} - {{ truncate(orgao.descricao, 36) }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="medicao_orgao_id"
          />
        </div>

        <div>
          <LabelFromYup
            name="medicao_grupo_ids"
            :schema="schema"
          />
          <AutocompleteField
            name="medicao_grupo_ids"
            :controlador="{
              busca: '',
              participantes: values.medicao_grupo_ids || []
            }"
            :grupo="equipesPorOrgaoIdPorPerfil[values.medicao_orgao_id]?.Medicao || []"
            :aria-busy="chamadasPendentesDeEquipes.lista"
            :class="{
              error: errors.medicao_grupo_ids
            }"
            label="titulo"
          />
          <ErrorMessage
            class="error-msg"
            name="medicao_grupo_ids"
          />
        </div>
      </div>

      <div class="f1 fb25em">
        <div>
          <LabelFromYup
            name="validacao_orgao_id"
            :schema="schema"
          />
          <Field
            name="validacao_orgao_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.validacao_orgao_id }"
            :aria-busy="organs.loading"
            @change="redefinirCamposDeGrupos('validacao')"
          >
            <option
              v-for="orgao in órgãosComoLista"
              :key="orgao.id"
              :value="orgao.id"
              :title="orgao.descricao?.length > 36 ? orgao.descricao : null"
            >
              {{ orgao.sigla }} - {{ truncate(orgao.descricao, 36) }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="validacao_orgao_id"
          />
        </div>
        <div>
          <LabelFromYup
            name="validacao_grupo_ids"
            :schema="schema"
          />
          <AutocompleteField
            name="validacao_grupo_ids"
            :controlador="{
              busca: '',
              participantes: values.validacao_grupo_ids || []
            }"
            :grupo="equipesPorOrgaoIdPorPerfil[values.validacao_orgao_id]?.Validacao || []"
            :aria-busy="chamadasPendentesDeEquipes.lista"
            :class="{
              error: errors.validacao_grupo_ids
            }"
            label="titulo"
          />
          <ErrorMessage
            class="error-msg"
            name="validacao_grupo_ids"
          />
        </div>
      </div>

      <div class="f1 fb25em">
        <div>
          <LabelFromYup
            name="liberacao_orgao_id"
            :schema="schema"
          />
          <Field
            name="liberacao_orgao_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.liberacao_orgao_id }"
            :aria-busy="organs.loading"
            @change="redefinirCamposDeGrupos('liberacao')"
          >
            <option
              v-for="orgao in órgãosComoLista"
              :key="orgao.id"
              :value="orgao.id"
              :title="orgao.descricao?.length > 36 ? orgao.descricao : null"
            >
              {{ orgao.sigla }} - {{ truncate(orgao.descricao, 36) }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="liberacao_orgao_id"
          />
        </div>

        <div>
          <LabelFromYup
            name="liberacao_grupo_ids"
            :schema="schema"
          />
          <AutocompleteField
            name="liberacao_grupo_ids"
            :controlador="{
              busca: '',
              participantes: values.liberacao_grupo_ids || []
            }"
            :grupo="equipesPorOrgaoIdPorPerfil[values.liberacao_orgao_id]?.Liberacao || []"
            :aria-busy="chamadasPendentesDeEquipes.lista"
            :class="{
              error: errors.liberacao_grupo_ids
            }"
            label="titulo"
          />
          <ErrorMessage
            class="error-msg"
            name="liberacao_grupo_ids"
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb15em mb1">
          <label class="flex flexcenter">
            <Field
              name="acumulativa"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
              :disabled="!ehNumerica"
            />
            <LabelFromYup
              class="mb0"
              name="acumulativa"
              as="span"
              :schema="schema"
              :class="{ error: errors.acumulativa }"
            />
          </label>
          <ErrorMessage
            class="error-msg"
            name="acumulativa"
          />
        </div>
        <div class="f1 fb15em mb1">
          <label class="flex flexcenter">
            <Field
              name="dado_aberto"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />
            <LabelFromYup
              class="mb0"
              name="dado_aberto"
              as="span"
              :schema="schema"
              :class="{ error: errors.dado_aberto }"
            />
          </label>
          <ErrorMessage
            class="error-msg"
            name="dado_aberto"
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap spacebetween g2 mb1">
        <LabelFromYup
          name="periodos"
          :schema="schema"
          as="legend"
          class="label tc300 fb100"
        />
        <div class="f1 fb20em flex flexwrap g2 mb1">
          <div class="f1 fb10em">
            <LabelFromYup
              name="periodos.preenchimento_inicio"
              :schema="schema"
            />
            <Field
              name="periodos.preenchimento_inicio"
              type="number"
              min="1"
              max="30"
              class="inputtext light mb1"
              :class="{ error: errors['periodos.preenchimento_inicio'] }"
            />
            <ErrorMessage
              class="error-msg"
              name="periodos.preenchimento_inicio"
            />
          </div>
          <div class="f1 fb10em">
            <LabelFromYup
              name="periodos.preenchimento_duracao"
              :schema="schema"
            />
            <Field
              name="periodos.preenchimento_duracao"
              type="number"
              min="1"
              class="inputtext light mb1"
              :class="{ error: errors['periodos.preenchimento_duracao'] }"
            />
            <ErrorMessage
              class="error-msg"
              name="periodos.preenchimento_duracao"
            />
          </div>
        </div>

        <div class="f1 fb20em flex flexwrap g2 mb1">
          <div class="f1 fb10em">
            <LabelFromYup
              name="periodos.validacao_duracao"
              :schema="schema"
            />
            <Field
              name="periodos.validacao_duracao"
              type="number"
              min="1"
              class="inputtext light mb1"
              :class="{ error: errors['periodos.validacao_duracao'] }"
            />
            <ErrorMessage
              class="error-msg"
              name="periodos.validacao_duracao"
            />
          </div>
          <div class="f1 fb10em">
            <LabelFromYup
              name="periodos.liberacao_duracao"
              :schema="schema"
            />
            <Field
              name="periodos.liberacao_duracao"
              type="number"
              min="1"
              class="inputtext light mb1"
              :class="{ error: errors['periodos.liberacao_duracao'] }"
            />
            <ErrorMessage
              class="error-msg"
              name="periodos.liberacao_duracao"
            />
          </div>
        </div>
      </div>
    </fieldset>

    <fieldset
      v-if="!variavelId"
    >
      <label class="block mb2 mt2">
        <input
          v-model="gerarMultiplasVariaveis"
          type="checkbox"
          class="interruptor"
          aria-labelledby="gerar-multiplas-variáveis"
        >
        <span
          id="gerar-multiplas-variáveis"
        >
          Gerar variáveis regionalizadas
        </span>
      </label>

      <fieldset v-if="gerarMultiplasVariaveis">
        <div class="flex spacebetween g2 mb1">
          <div class="f1 fb15em mb1 mt2">
            <label class="block">
              <Field
                name="criar_formula_composta"
                type="checkbox"
                :value="true"
                :unchecked-value="false"
              />
              <LabelFromYup
                name="criar_formula_composta"
                as="span"
                :schema="schema"
                :class="{ error: errors.criar_formula_composta }"
              />
            </label>
            <ErrorMessage
              class="error-msg"
              name="criar_formula_composta"
            />
          </div>
        </div>

        <div
          class="flex flexwrap g2 mb1"
        >
          <div class="fb20em">
            <LabelFromYup
              name="nivel_regionalizacao"
              :schema="schema"
              class="tc300"
            />
            <Field
              id="nivel_regionalizacao"
              name="nivel_regionalizacao"
              as="select"
              class="inputtext light mb1"
              :class="{ error: errors.nivel_regionalizacao }"
              @change="resetField('regioes', { value: [] })"
            >
              <option
                :value="null"
              />
              <option
                v-for="nível in Object.values(niveisRegionalizacao)"
                :key="nível.id"
                :value="nível.id"
                :disabled="!regiõesPorNívelOrdenadas?.[nível.id]?.length"
              >
                {{ nível.nome }}
              </option>
            </Field>
            <ErrorMessage
              class="error-msg"
              name="nivel_regionalizacao"
            />
          </div>

          <hr class="f1 mt3">
          <label class="mt2">
            <input
              v-model="estãoTodasAsRegiõesSelecionadas"
              type="checkbox"
              :disabled="!regiõesPorNívelOrdenadas?.[values.nivel_regionalizacao]?.length"
              class="interruptor"
              aria-labelledby="selecionar-todas-as-regiões"
            >
            <span
              v-if="estãoTodasAsRegiõesSelecionadas"
              id="selecionar-todas-as-regiões"
            >
              Limpar seleção
            </span>
            <span
              v-else
              id="selecionar-todas-as-regiões"
            >
              Selecionar todas
            </span>
          </label>
        </div>
        <div class="flex flexwrap g2 mb1">
          <div
            v-if="Array.isArray(regiõesPorNívelOrdenadas?.[values.nivel_regionalizacao])"
            class="flex flexwrap g1 lista-de-opções"
          >
            <LabelFromYup
              class="label fb100"
              as="legend"
              :schema="schema"
              name="regioes"
            />
            <label
              v-for="r in regiõesPorNívelOrdenadas?.[values.nivel_regionalizacao]"
              :key="r.id"
              class="tc600 lista-de-opções__item"
              :for="`região__${r.id}`"
            >
              <Field
                :id="`região__${r.id}`"
                :key="`região__${r.id}`"
                name="regioes"
                :value="r.id"
                type="checkbox"
                :class="{ 'error': errors['parametros.tipo'] }"
              />
              <span>
                {{ r.descricao }}
              </span>
            </label>
          </div>
          <div
            v-else-if="values.nivel_regionalizacao"
            class="error-msg"
          >
            Não há regiões disponíveis para o
            <router-link to="#nivel_regionalizacao">
              nível
            </router-link>
            escolhido.
          </div>

          <ErrorMessage
            class="fb100 error-msg"
            name="regioes"
          />
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="mb2 mt2">
            <label class="block">
              <Field
                name="supraregional"
                type="checkbox"
                :value="true"
              /><LabelFromYup
                name="supraregional"
                :schema="schema"
                as="span"
                :class="{ error: errors.supraregional }"
              />
            </label>
            <ErrorMessage
              class="error-msg"
              name="supraregional"
            />
          </div>
        </div>
      </fieldset>
    </fieldset>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :aria-busy="chamadasPendentes.emFoco"
      >
        <template v-if="gerarMultiplasVariaveis">
          Gerar
        </template>
        <template v-else>
          Salvar
        </template>
      </button>
      <hr class="ml2 f1">
    </div>
  </form>

  <ErrorComponent
    v-if="erros.emFoco"
    class="mb1"
  >
    {{ erros.emFoco }}
  </ErrorComponent>
</template>
