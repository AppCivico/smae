<script setup>
import SmallModal from '@/components/SmallModal.vue';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import { geoLocalização as schema } from '@/consts/formSchemas';
import tiposDeLogradouro from '@/consts/tiposDeLogradouro';
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useRegionsStore } from '@/stores/regions.store';
import { cloneDeep, isArray, merge } from 'lodash';
import { vMaska } from 'maska';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useField,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed, defineModel, defineOptions, nextTick, ref, toRef,
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
    default: Infinity,
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
const sugestõesDeEndereços = ref([]);
const coordenadasSelecionadas = ref([]);
const logradouroCep = ref('');
const logradouroNome = ref('');
const logradouroNúmero = ref('');
const logradouroTipo = ref('');
const logradouroRótulo = ref('');

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

const nomeDoCampo = toRef(props, 'name');

const { handleChange } = useField(nomeDoCampo, undefined, {
  initialValue: model.value,
});

const endereçosConsolidadosPorToken = computed(() => ({
  ...props.geolocalizaçãoPorToken,
  ...endereçosTemporários.value,
}));

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
    sugestõesDeEndereços.value.splice(0, sugestõesDeEndereços.value.length);
    coordenadasSelecionadas.value.splice(0, coordenadasSelecionadas.value.length);
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

function abrirEdição(índice) {
  ediçãoDeEndereçoAberta.value = índice;
}

function adicionarItem() {
  model.value.push('');

  nextTick().then(() => {
    abrirEdição(model.value.length - 1);
  });
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
          rotulo: carga.rotulo || '',
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
  <table
    v-bind="$attrs"
    class="tablemain"
  >
    <col>
    <col>
    <col>
    <col class="col--number">
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">

    <thead>
      <th />
      <th>Endereço</th>
      <th>Bairro</th>
      <th class="cell--number">
        <abbr title="Código de Endereçamento Postal">CEP</abbr>
      </th>
      <th />
      <th />
    </thead>
    <tbody>
      <tr
        v-for="(token, i) in model"
        :key="token"
      >
        <th>
          {{ endereçosConsolidadosPorToken[token]?.endereco?.properties?.rotulo || '-' }}
        </th>
        <td class="f1">
          {{ endereçosConsolidadosPorToken[token]?.endereco_exibicao
            || endereçosConsolidadosPorToken[token]?.endereco?.properties?.string_endereco
            || '-' }}
        </td>
        <td>
          {{ endereçosConsolidadosPorToken[token]?.endereco?.properties?.bairro || '-' }}
        </td>
        <td class="cell--number">
          {{ endereçosConsolidadosPorToken[token]?.endereco?.properties?.cep || '-' }}
        </td>
        <td>
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
        </td>
        <td>
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
        </td>

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
              <table
                v-if="sugestõesDeEndereços.length"
                class="mb1 tablemain"
              >
                <col class="col--botão-de-ação">
                <col>
                <col>
                <col>
                <thead>
                  <th />
                  <th>Endereço</th>
                  <th>Bairro</th>
                  <th class="cell--number">
                    <abbr title="Código de Endereçamento Postal">CEP</abbr>
                  </th>
                </thead>
                <tr
                  v-for="(item, j) in sugestõesDeEndereços"
                  :key="j"
                >
                  <td>
                    <Field
                      :id="`item--${j}`"
                      v-model="sugestãoSelecionada"
                      type="radio"
                      class="mr1"
                      name="localização"
                      :value="item"
                      @change="preencherFormulário(item)"
                    />
                  </td>
                  <td>
                    <label :for="`item--${j}`">
                      {{ item.endereco?.properties?.string_endereco }}
                    </label>
                  </td>
                  <td>
                    {{ item.endereco?.properties?.bairro || '-' }}
                  </td>
                  <td>
                    {{ item.endereco?.properties?.cep || '-' }}
                  </td>
                </tr>
              </table>
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
              <div class="mb1">
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

                <dl class="flex g2">
                  <div class="f1 mb1">
                    <dt class="t12 uc w700 mb05 tamarelo">
                      Latitude
                    </dt>
                    <dd class="t13">
                      {{ coordenadasSelecionadas[0] }}
                    </dd>
                  </div>

                  <div class="f1 mb1">
                    <dt class="t12 uc w700 mb05 tamarelo">
                      Longitude
                    </dt>
                    <dd class="t13">
                      {{ coordenadasSelecionadas[1] }}
                    </dd>
                  </div>

                  <template v-if="Array.isArray(sugestãoSelecionada?.camadas)">
                    <div
                      v-for="camada in
                        sugestãoSelecionada.camadas"
                      :key="camada.id"
                      class="f2 mb1"
                    >
                      <dt class="t12 uc w700 mb05 tamarelo">
                        {{ camada.descricao }}
                      </dt>
                      <dd class="t13">
                        {{ camada.titulo }}
                      </dd>
                    </div>
                  </template>
                </dl>
              </div>
            </Transition>

            <div class="flex g2 flexwrap">
              <div class="f2 fb100">
                <LabelFromYup
                  name="cep"
                  :schema="schema"
                />
                <Field
                  id="cep"
                  v-model.trim="logradouroCep"
                  v-maska
                  name="cep"
                  class="inputtext light mb1"
                  :disabled="!sugestãoSelecionada"
                  data-maska="#####-###'"
                />
                <ErrorMessage
                  class="error-msg mb1"
                  name="cep"
                />
              </div>

              <div class="f1">
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
              <div class="f4">
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
              <div class="f1">
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

              <div class="fb100">
                <LabelFromYup
                  name="rotulo"
                  :schema="schema"
                />

                <Field
                  id="rotulo"
                  v-model.trim="logradouroRótulo"
                  name="rotulo"
                  type="text"
                  class="inputtext light mb1"
                  :disabled="!sugestãoSelecionada"
                />
                <ErrorMessage
                  class="error-msg mb1"
                  name="rotulo"
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
      </tr>
    </tbody>
  </table>

  <button
    :disabled="!(model.length < Number(props.max)) "
    class="block like-a__text addlink mb1 mt1"
    type="button"
    @click="adicionarItem"
  >
    <svg
      width="20"
      height="20"
    ><use xlink:href="#i_+" /></svg>Adicionar endereço
  </button>
</template>
