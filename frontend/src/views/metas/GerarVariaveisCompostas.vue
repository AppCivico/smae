<script setup>
import AbsoluteNumberInput from '@/components/AbsoluteNumberInput.vue';
import { geraçãoDeVariávelComposta } from '@/consts/formSchemas';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useIndicadoresStore } from '@/stores/indicadores.store';
import { useRegionsStore } from '@/stores/regions.store';
import { useVariaveisStore } from '@/stores/variaveis.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';

import níveisRegionalização from '@/consts/niveisRegionalizacao';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const alertStore = useAlertStore();
const editModalStore = useEditModalStore();
const IndicadoresStore = useIndicadoresStore();

const route = useRoute();
const { indicador_id: indicadorId } = route.params;

const lastParent = ref({});

const { singleIndicadores } = storeToRefs(IndicadoresStore);
const VariaveisStore = useVariaveisStore();
const {
  singleVariaveis, variáveisPorCódigo, operaçõesParaVariávelComposta,
} = storeToRefs(VariaveisStore);
VariaveisStore.clearEdit();

const RegionsStore = useRegionsStore();
const { regions, regiõesPorNívelOrdenadas } = storeToRefs(RegionsStore);

const valoresIniciais = {
  codigo: '',
  janela: 1,
  mostrar_monitoramento: false,
  nivel_regionalizacao: 0,
  regioes: [],
  tipo_de_janela: 'mes_corrente',
  titulo: '',
  usar_serie_acumulada: false,
};

const schema = computed(() => (Array.isArray(operaçõesParaVariávelComposta.value)
  ? geraçãoDeVariávelComposta(operaçõesParaVariávelComposta.value)
  : geraçãoDeVariávelComposta()));

const {
  errors, handleSubmit, isSubmitting, resetField, values,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

const formulárioSujo = useIsFormDirty();

const nívelDeRegionalização = ref(0);
const regiõesSelecionadas = ref([]);

const regiõesDisponíveis = computed(() => (Array.isArray(regiõesPorNívelOrdenadas.value?.[
  nívelDeRegionalização.value
])
  ? regiõesPorNívelOrdenadas.value[nívelDeRegionalização.value]
  : []));

const idsDasRegiõesVálidas = computed(() => regiõesDisponíveis.value
  .map((x) => x.id));

const estãoTodasAsRegiõesSelecionadas = computed({
  get() {
    return regiõesSelecionadas.value?.length
      && regiõesSelecionadas.value.length === regiõesDisponíveis.value.length;
  },
  // eslint-disable-next-line padded-blocks
  set(novoValor) {
    // Não é bonito, mas é o único jeito que achei do framework não confundir a
    // redefinição com um push;
    if (novoValor) {
      regiõesSelecionadas.value
        .splice(0, regiõesSelecionadas.value.length, ...idsDasRegiõesVálidas);
    } else {
      regiõesSelecionadas.value.splice(0, regiõesSelecionadas.value.length);
    }
  },
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    const msg = 'Item adicionado com sucesso!';
    const r = await VariaveisStore.gerarCompostas(values);

    if (r) {
      VariaveisStore.getAll(indicadorId);
      VariaveisStore.getAllCompound(indicadorId);
      alertStore.success(msg);
      editModalStore.$reset();
      if (route.meta.rotaDeEscape) {
        router.push({
          name: route.meta.rotaDeEscape,
          // ao que parece, os parâmetros só não são necessários
          // se a rota corrente e a de destino forem aninhadas
          params: route.params,
          query: route.query,
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function BuscarAuxiliares(valorOuEvento) {
  const código = valorOuEvento.target?.value || valorOuEvento;

  if (!variáveisPorCódigo?.value?.[código]) {
    VariaveisStore.getAuxiliares(código);
  }
}

if (!regions.length) {
  RegionsStore.getAll();
}

if (String(singleIndicadores.value?.id) !== String(indicadorId)) {
  IndicadoresStore.getById(indicadorId);
}
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ $route.meta.título }}</h2>
    <hr class="ml2 f1">

    <CheckClose
      :formulário-sujo="formulárioSujo"
    />
  </div>

  <form
    :disabled="isSubmitting"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f0">
        <label class="label">
          Código Prefixo <span class="tvermelho">*</span>
        </label>
        <Field
          name="codigo"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors.codigo }"
          @change="BuscarAuxiliares"
        />
        <div class="error-msg">
          {{ errors.codigo }}
        </div>
      </div>
      <div class="f1">
        <label class="label">
          Título <span class="tvermelho">*</span>
        </label>
        <Field
          name="titulo"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors.titulo }"
        />
        <div class="error-msg">
          {{ errors.titulo }}
        </div>
      </div>
    </div>

    <div class="mb1">
      <label class="label">
        Nível de regionalização
        <span class="tvermelho">*</span>
      </label>
      <Field
        id="nivel_regionalizacao"
        v-model="nívelDeRegionalização"
        name="nivel_regionalizacao"
        as="select"
        class="inputtext light"
        :class="{ 'error': errors.nivel_regionalizacao }"
        :disabled="typeof singleIndicadores?.nivel_regionalizacao !== 'number'"
        @change="() => { estãoTodasAsRegiõesSelecionadas = true; }"
      >
        <option
          :value="0"
          disabled
        />
        <option
          v-for="nível in níveisRegionalização"
          :key="nível.id"
          :value="nível.id"
          :disabled="typeof singleIndicadores?.nivel_regionalizacao !== 'number'
            || singleIndicadores?.nivel_regionalizacao < nível.id"
        >
          {{ nível.nome }}
        </option>
      </Field>
      <ErrorMessage
        name="nivel_regionalizacao"
        class="error-msg"
      />
    </div>
    <pre v-ScrollLockDebug>values.regioes:{{ values.regioes }}</pre>

    <pre v-ScrollLockDebug>regiõesSelecionadas:{{ regiõesSelecionadas }}</pre>

    <div class="mb2">
      <div class="flex spacebetween center mb1">
        <legend class="label mb1">
          Regiões abrangidas
        </legend>
        <hr class="ml2 f1">
        <label class="ml2">
          <input
            v-model="estãoTodasAsRegiõesSelecionadas"
            type="checkbox"
            :disabled="!regiõesDisponíveis.length"
            class="inputcheckbox interruptor"
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

      <div
        v-if="Array.isArray(regiõesPorNívelOrdenadas?.[values.nivel_regionalizacao])"
        class="flex flexwrap g1 lista-de-opções"
      >
        <label
          v-for="r in regiõesPorNívelOrdenadas?.[values.nivel_regionalizacao]"
          :key="r.id"
          class="tc600 lista-de-opções__item"
          :for="`região__${r.id}`"
        >
          <Field
            :id="`região__${r.id}`"
            :key="`região__${r.id}`"
            v-model="regiõesSelecionadas"
            name="regioes"
            :value="r.id"
            type="checkbox"
            class="inputcheckbox"
            :class="{ 'error': errors['parametros.tipo'] }"
          />
          <span>
            {{ r.descricao }}
          </span>
        </label>
      </div>
      <div
        v-else
        class="error-msg"
      >
        Não há regiões para o
        <SmaeLink to="#nivel_regionalizacao">
          nível
        </SmaeLink>
        escolhido.
      </div>
    </div>

    <div class="flex g2">
      <div
        class="f1 mb1"
        :class="{
          desabilitado: !Array.isArray(operaçõesParaVariávelComposta)
            || !operaçõesParaVariávelComposta.length
        }"
      >
        <label class="label">
          Operação padrão do agregador
          <span class="tvermelho">*</span>
        </label>
        <Field
          name="operacao"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.operacao }"
          :disabled="!Array.isArray(operaçõesParaVariávelComposta)
            || !operaçõesParaVariávelComposta.length"
        >
          <option
            :value="null"
            disabled
          />
          <template v-if="Array.isArray(operaçõesParaVariávelComposta)">
            <option
              v-for="operação in operaçõesParaVariávelComposta"
              :key="operação"
              :value="operação"
            >
              {{ operação }}
            </option>
          </template>
        </Field>
        <ErrorMessage
          name="operacao"
          class="error-msg"
        />
      </div>
    </div>

    <div class="mb1">
      <legend class="label mb1">
        Configuração padrão do uso da variável na fórmula
      </legend>
      <div class="flex flexwrap g1">
        <div class="f1">
          <label class="block mb1"><Field
            type="radio"
            name="tipo_de_janela"
            class="inputcheckbox"
            value="mes_corrente"
            @change="($event) => {
              if (values.tipo_de_janela === $event.target.value) {
                resetField('janela', { value: 1 });
              }
            }"
          /><span class="tc600">Mês corrente</span></label>

          <label class="block mb1"><Field
            type="radio"
            name="tipo_de_janela"
            class="inputcheckbox"
            value="media"
          /><span class="tc600">Média</span></label>

          <label class="block mb1"><Field
            type="radio"
            name="tipo_de_janela"
            class="inputcheckbox"
            value="meses_anteriores"
          /><span class="tc600">Meses anteriores</span></label>
        </div>

        <div class="f0">
          <label class="block mt2 mb2">
            <Field
              type="checkbox"
              class="inputcheckbox"
              name="usar_serie_acumulada"
              :value="true"
              :unchecked-value="false"
            /><span class="tc600">Utilizar valores acumulados</span>
          </label>
        </div>
        <div
          v-if="values.tipo_de_janela !== 'mes_corrente'"
          class="fb100"
        >
          <label class="label tc600">Meses</label>

          <AbsoluteNumberInput
            name="janela"
            :value="values.janela"
            class="inputtext light mb1"
            min="1"
            :negative="values.tipo_de_janela === 'meses_anteriores'"
          />

          <p
            v-if="values.tipo_de_janela === 'media'"
            class="t300 tc500"
          >
            Insira o número de meses considerados.
          </p>
          <p
            v-if="values.tipo_de_janela === 'meses_anteriores'"
            class="t300 tc500"
          >
            Insira o número de meses considerados em relação ao mês
            corrente.
          </p>
        </div>
      </div>
    </div>

    <label class="block mt2 mb2">
      <Field
        name="mostrar_monitoramento"
        type="checkbox"
        class="inputcheckbox"
        :value="true"
        :unchecked-value="false"
        :class="{ 'error': errors.mostrar_monitoramento }"
      />
      <span>Utilizar como agrupamento na coleta de dados</span>
    </label>

    <FormErrorsList :errors="errors" />

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
  </form>

  <span
    v-if="singleVariaveis?.loading || lastParent?.loading"
    class="spinner"
  >Carregando</span>

  <div
    v-if="singleVariaveis?.error || lastParent?.error"
    class="error p1"
  >
    <div class="error-msg">
      {{ singleVariaveis.error ?? lastParent?.error }}
    </div>
  </div>
</template>

<style lang="less">
.lista-de-opções {}

.lista-de-opções__item {
  flex-basis: 20%;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
