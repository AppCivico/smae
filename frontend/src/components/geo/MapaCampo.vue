<script setup>
import SmallModal from '@/components/SmallModal.vue';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import { geoLocalização as schema } from '@/consts/formSchemas';
import tiposDeLogradouro from '@/consts/tiposDeLogradouro';
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useRegionsStore } from '@/stores/regions.store';
import { cloneDeep, isArray, merge } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useField,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed, defineModel, defineOptions, ref,
} from 'vue';

const RegionsStore = useRegionsStore();
const { camadas, chamadasPendentes } = storeToRefs(RegionsStore);

const baseUrl = `${import.meta.env.VITE_API_URL}`;

defineOptions({ inheritAttrs: false });

const model = defineModel({
  required: true,
  default: () => [],
});
const props = defineProps({
  título: {
    type: String,
    default: '',
  },
  geolocalizaçãoPorToken: {
    type: Object,
    default: () => ({}),
  },
  max: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
  name: {
    type: String,
    required: true,
  },
});

const alertStore = useAlertStore();

const valoresIniciais = {};

const buscandoEndereços = ref(false);
const ediçãoDeEndereçoAberta = ref(-1);
const erroNaBuscaDeEndereço = ref(null);
const termoDeBusca = ref('');
const sugestãoSelecionada = ref(null);
const sugestõesDeEndereços = ref([
]);
const coordenadasSelecionadas = ref([]);
const logradouroCep = ref('');
const logradouroNome = ref('');
const logradouroNúmero = ref('');
const logradouroTipo = ref('');

const marcador = ref([]);

const endereçosTemporários = ref({});

const camadasSelecionadas = computed(() => (Array.isArray(sugestãoSelecionada.value?.camadas)
  ? sugestãoSelecionada.value.camadas
    .reduce((acc, cur) => (camadas?.value?.[cur.id]?.geom_geojson?.geometry.type === 'Polygon'
      ? acc.concat(camadas?.value?.[cur.id])
      : acc), [])
  : []));

const {
  errors, handleSubmit, isSubmitting, resetField, validateField, values: carga,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

const { handleChange } = useField(props.name, undefined, {
  initialValue: model.value,
});

function abrirEdição(índice) {
  ediçãoDeEndereçoAberta.value = índice;
}

async function preencherFormulário(item) {
  if (isArray(item?.endereco?.geometry?.coordinates)) {
    coordenadasSelecionadas.value = item.endereco.geometry.coordinates.toReversed();
  }
  if (isArray(item?.endereco?.geometry?.coordinates)) {
    marcador.value = item.endereco.geometry.coordinates.toReversed();
  }

  const palavrasDaRua = typeof item.endereco?.properties?.rua === 'string'
    ? item.endereco.properties.rua.split(' ')
    : [];

  logradouroTipo.value = palavrasDaRua[0]
    ? tiposDeLogradouro.find((x) => x === palavrasDaRua[0])
    : '';

  logradouroNome.value = logradouroTipo.value
    ? palavrasDaRua.slice(1).join(' ')
    : item.endereco?.properties?.rua;
  logradouroNúmero.value = item.endereco?.properties?.numero ?? '';

  if (Array.isArray(item.camadas)) {
    const camadasABuscar = item.camadas.reduce((acc, cur) => (!camadas?.value?.[cur.id]
      ? acc.concat([cur.id])
      : acc), []);

    if (camadasABuscar.length) {
      await RegionsStore.buscarCamadas(item.camadas.map((x) => x.id));
    }
  }
}

async function buscarEndereço(valor) {
  const { valid: buscaVálida } = await validateField('termo_de_busca');

  if (buscaVálida) {
    erroNaBuscaDeEndereço.value = null;
    sugestãoSelecionada.value = null;
    sugestõesDeEndereços.value = [];

    coordenadasSelecionadas.value = [];
    buscandoEndereços.value = true;

    resetField('cep', { value: undefined });
    resetField('tipo', { value: undefined });
    resetField('rua', { value: undefined });
    resetField('numero', { value: undefined });

    try {
      const { linhas } = await requestS.post(`${baseUrl}/geolocalizar`, {
        tipo: 'Endereco',
        busca_endereco: valor,
      }, false);

      if (Array.isArray(linhas)) {
        sugestõesDeEndereços.value = linhas;

        if (linhas.length === 1) {
          preencherFormulário(linhas[0]);
        } else if (!linhas.length) {
          erroNaBuscaDeEndereço.value = 'Sem resultados';
        }
      } else {
        throw new Error('Lista de endereços fora do formato esperado');
      }
    } catch (erro) {
      erroNaBuscaDeEndereço.value = erro;
    } finally {
      buscandoEndereços.value = false;
    }
  }
}

const onSubmit = handleSubmit(async () => {
  const cópiaDaSeleção = cloneDeep(sugestãoSelecionada.value);

  const dadosParaEnvio = merge(
    cópiaDaSeleção,
    {
      tipo: 'Endereco',
      endereco: {
        properties: {
          rua: `${carga.tipo} ${carga.rua}`,
          numero: carga.numero || undefined,
          cep: carga.cep || undefined,
          string_endereco: `${carga.tipo} ${carga.rua}${carga.numero
            ? `, ${carga.numero}`
            : ''}`.trim(),
        },
        geometry: {
          coordinates: coordenadasSelecionadas.value.toReversed(),
        },
      },
      camadas: cópiaDaSeleção.camadas.map((x) => x.id),
    },
  );

  try {
    const resposta = await requestS.post(`${baseUrl}/geolocalizacao`, dadosParaEnvio);

    if (!resposta.token) {
      throw new Error('token ausente da resposta');
    }
    model.value[ediçãoDeEndereçoAberta.value] = resposta.token;
    endereçosTemporários.value[resposta.token] = cloneDeep(dadosParaEnvio);
    handleChange(model.value);

    alertStore.success('Endereço salvo!');

    ediçãoDeEndereçoAberta.value = -1;
  } catch (error) {
    alertStore.error(error);
  }
});
const formulárioSujo = useIsFormDirty();
</script>
<template>
  <ul v-bind="$attrs">
    <template
      v-for="(token, i) in model"
      :key="token"
    >
      <li class="flex g1 mb1">
        <span class="f1">
          {{ geolocalizaçãoPorToken[token]?.endereco_exibicao
            || endereçosTemporários[token]?.endereco?.properties?.string_endereco
            || '-' }}
        </span>

        <button
          class="block like-a__text addlink tipinfo"
          type="button"
          @click="abrirEdição(i)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_edit" /></svg><div>Editar endereço</div>
        </button>

        <button
          class="block like-a__text addlink tipinfo"
          type="button"
          @click="model.splice(i, 1)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_remove" /></svg><div>remover endereço</div>
        </button>
      </li>

      <SmallModal
        v-if="ediçãoDeEndereçoAberta === i"
      >
        <div class="flex spacebetween center mb2">
          <h2>
            {{ props.título || 'Registro de endereço' }}
          </h2>
          <hr class="ml2 f1">

          <CheckClose
            :formulário-sujo="formulárioSujo"
            :apenas-emitir="true"
            @close="ediçãoDeEndereçoAberta = -1"
          />
        </div>

        <form
          :disabled="isSubmitting || buscandoEndereços"
          @submit.prevent="onSubmit"
        >
          <div class="flex g2 flexwrap">
            <div class="f1 mb1">
              <LabelFromYup
                name="termo_de_busca"
                :schema="schema"
              />

              <Field
                v-model="termoDeBusca"
                name="termo_de_busca"
                type="search"
                class="inputtext light mb1"
                autocomplete="street-address"
                minlength="3"
                :class="{
                  loading: buscandoEndereços,
                }"
                @keypress.enter.prevent="buscarEndereço(termoDeBusca)"
              />

              <ErrorMessage
                v-if="errors.termo_de_busca"
                name="termo_de_busca"
                class="error-msg"
              />

              <div
                v-else-if="erroNaBuscaDeEndereço || buscandoEndereços"
                class="error-msg mb1"
              >
                {{ erroNaBuscaDeEndereço }}
              </div>
            </div>

            <div class="center">
              <button
                type="button"
                class="btn small bgnone outline mt2"
                :disabled="isSubmitting"
                @click="buscarEndereço(termoDeBusca)"
              >
                Procurar no mapa
              </button>
            </div>
          </div>

          <Transition
            name="expand"
          >
            <ul v-if="sugestõesDeEndereços.length">
              <li
                v-for="(item, j) in sugestõesDeEndereços"
                :key="j"
                class="mb1"
              >
                <Field
                  :id="`item--${j}`"
                  v-model="sugestãoSelecionada"
                  type="radio"
                  class="mr1"
                  name="localização"
                  :value="item"
                  @change="preencherFormulário(item)"
                />
                <label :for="`item--${j}`">
                  {{ item.endereco?.properties?.string_endereco }}
                </label>
              </li>
            </ul>
          </Transition>

          <div
            v-ScrollLockDebug
            class="flex g1 flexwrap"
          >
            <div class="f1">
              <label class="label f1">
                marcador para carga no mapa
              </label>
              <input
                v-model="marcador"
                type="text"
                readonly
                style="width: 100%;"
                class="inputtext light mb1 f1"
              >
            </div>
            <div class="f1">
              <label class="label f1">
                marcador com posição atualizada
              </label>
              <input
                v-model="coordenadasSelecionadas"
                type="text"
                readonly
                style="width: 100%;"
                class="inputtext light mb1 f1"
              >
            </div>
          </div>

          <LoadingComponent
            v-if="chamadasPendentes.camadas"
            class="mb1"
          >
            buscando dados
          </LoadingComponent>

          <Transition
            name="expand"
          >
            <MapaExibir
              v-if="sugestãoSelecionada"
              v-model="coordenadasSelecionadas"
              :marcador="marcador"
              :polígonos="camadasSelecionadas"
              class="mb1"
              :latitude="marcador[0]"
              :longitude="marcador[1]"
              :opções-do-polígono="{
                fill: true,
                opacity: 0.5,
              }"
              zoom="16"
              :opções-do-marcador="{ draggable: true }"
            />
          </Transition>
          <div class="flex g2 flexwrap">
            <div class="mb1 f2">
              <LabelFromYup
                name="cep"
                :schema="schema"
              />
              <Field
                id="cep"
                v-model.trim="logradouroCep"
                name="cep"
                class="inputtext light mb1"
                :disabled="!sugestãoSelecionada"
              />
              <ErrorMessage
                class="error-msg mb1"
                name="cep"
              />
            </div>
          </div>

          <div class="flex g2 flexwrap">
            <div class="mb1 f1">
              <LabelFromYup
                name="tipo"
                :schema="schema"
              />
              <Field
                id="tipo"
                v-model="logradouroTipo"
                name="tipo"
                class="inputtext light mb1"
                as="select"
                :disabled="!sugestãoSelecionada"
              >
                <option :value="null" />
                <option
                  v-for="item in tiposDeLogradouro"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                </option>
              </Field>
              <ErrorMessage
                class="error-msg mb1"
                name="tipo"
              />
            </div>
            <div class="f4 mb1">
              <LabelFromYup
                name="rua"
                :schema="schema"
              />

              <Field
                id="rua"
                v-model.trim="logradouroNome"
                name="rua"
                type="text"
                class="inputtext light mb1"
                :disabled="!sugestãoSelecionada"
              />
              <ErrorMessage
                class="error-msg mb1"
                name="rua"
              />
            </div>
            <div class="f1 mb1">
              <LabelFromYup
                name="numero"
                :schema="schema"
              />

              <Field
                id="numero"
                v-model.trim="logradouroNúmero"
                name="numero"
                type="text"
                class="inputtext light mb1"
                :disabled="!sugestãoSelecionada"
              />
              <ErrorMessage
                class="error-msg mb1"
                name="numero"
              />
            </div>
          </div>

          <FormErrorsList
            :errors="errors"
            class="mb1"
          />

          <div class="flex spacebetween center g2 mb2">
            <hr class="f1">
            <button
              type="submit"
              class="btn big"
              :disabled="isSubmitting || Object.keys(errors)?.length"
              :class="{
                loading: isSubmitting
              }"
            >
              Salvar
            </button>
            <hr class="f1">
          </div>
        </form>
      </SmallModal>
    </template>
  </ul>

  <button
    :disabled="!model.length < Number(props.max)"
    class="block like-a__text addlink mb1 mt1"
    type="button"
    @click="model.push('')"
  >
    <svg
      width="20"
      height="20"
    ><use xlink:href="#i_+" /></svg>Adicionar endereço
  </button>
</template>
