<script setup>
import { Field } from 'vee-validate';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import SmaeRangeInput from '@/components/camposDeFormulario/SmaeRangeInput.vue';
import * as CardEnvelope from '@/components/cardEnvelope';
import ErrorComponent from '@/components/ErrorComponent.vue';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import dinheiro from '@/helpers/dinheiro';
import requestS from '@/helpers/requestS';

const route = useRoute();
const baseUrl = `${import.meta.env.VITE_API_URL}/public/demandas`;

const colunasDemandas = [
  {
    chave: 'gestor_municipal',
    label: 'Gestor Municipal',
    formatador: (valor) => valor?.nome_exibicao || '—',
  },
  {
    chave: 'nome_projeto',
    label: 'Nome do Projeto',
  },
  {
    chave: 'area_tematica',
    label: 'Área',
    formatador: (valor) => valor?.nome || '—',
  },
  {
    chave: 'descricao',
    label: 'Descrição',
    formatador: (valor) => (valor && valor.length > 100
      ? `${valor.substring(0, 100)}...`
      : valor || '—'),
  },
  {
    chave: 'valor',
    label: 'Valor',
    formatador: (valor) => dinheiro(valor, { style: 'currency', currency: 'BRL' }),
    atributosDaCelula: {
      class: 'cell--number',
    },
    atributosDoCabecalhoDeColuna: {
      class: 'cell--number',
    },
  },
  {
    chave: 'finalidade',
    label: 'Finalidade',
  },
  {
    chave: 'geolocalizacao',
    label: 'Localização',
    formatador: (valor) => valor?.[0]?.descricao || '—',
  },
  {
    chave: 'acao',
    label: '',
    atributosDaCelula: {
      class: 'tc',
    },
    atributosDoCabecalhoDeColuna: {
      class: 'tc',
    },
    atributosDaColuna: {
      class: 'col--botão-de-ação',
    },
  },
];

const resumoDemandas = ref([]);
const todasDemandas = ref([]);
const geopontos = ref([]);
const datasetCompletoCarregado = ref(false);
const filtros = ref(null);
const camadasGeo = ref([]);
const chamadasPendentes = ref({
  resumo: false,
  completo: false,
  geopontos: false,
  geocamadas: false,
});
const erro = ref(null);

async function carregarResumo() {
  chamadasPendentes.value.resumo = true;
  erro.value = null;

  try {
    const resposta = await requestS.get(
      `${baseUrl}/resumo`,
      null,
      { AlertarErros: false },
    );

    resumoDemandas.value = resposta.recent_demandas || [];
    filtros.value = resposta.filters || null;
  } catch (e) {
    erro.value = 'Não foi possível carregar as demandas.';
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar resumo de demandas:', e);
  } finally {
    chamadasPendentes.value.resumo = false;
  }
}

async function carregarGeopontos() {
  chamadasPendentes.value.geopontos = true;

  try {
    const resposta = await requestS.get(
      `${baseUrl}/geopontos`,
      null,
      { AlertarErros: false },
    );

    geopontos.value = resposta.points || [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar geopontos:', e);
    geopontos.value = [];
  } finally {
    chamadasPendentes.value.geopontos = false;
  }
}

async function carregarDatasetCompleto() {
  if (datasetCompletoCarregado.value) {
    return;
  }

  chamadasPendentes.value.completo = true;
  erro.value = null;

  try {
    const resposta = await requestS.get(
      `${baseUrl}/completo`,
      null,
      { AlertarErros: false },
    );

    todasDemandas.value = resposta.demandas || [];
    datasetCompletoCarregado.value = true;
  } catch (e) {
    erro.value = 'Não foi possível carregar todas as demandas.';
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar dataset completo:', e);
  } finally {
    chamadasPendentes.value.completo = false;
  }
}

async function buscarGeoCamadas() {
  chamadasPendentes.value.geocamadas = true;

  try {
    const resposta = await requestS.get(
      `${baseUrl}/geocamadas`,
      null,
      { AlertarErros: false },
    );

    camadasGeo.value = resposta.data || [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar camadas geográficas:', e);
    camadasGeo.value = [];
  } finally {
    chamadasPendentes.value.geocamadas = false;
  }
}

onMounted(async () => {
  await Promise.all([
    carregarResumo(),
    carregarGeopontos(),
    buscarGeoCamadas(),
  ]);

  if (Object.keys(route.query).length > 0) {
    await carregarDatasetCompleto();
  }
});

function obterPropriedadesDemanda(demandaId) {
  const resumo = resumoDemandas.value.find((d) => d.id === demandaId);
  if (resumo) {
    return {
      demanda_id: demandaId,
      nome_projeto: resumo.nome_projeto,
      finalidade: resumo.finalidade,
      valor: resumo.valor,
    };
  }

  const completa = todasDemandas.value.find((d) => d.id === demandaId);
  if (completa) {
    return {
      demanda_id: demandaId,
      nome_projeto: completa.nome_projeto,
      finalidade: completa.finalidade,
      valor: completa.valor,
    };
  }

  return {
    demanda_id: demandaId,
  };
}

async function aoSubmeterFiltros(event, aplicarQueryStrings) {
  if (!datasetCompletoCarregado.value) {
    await carregarDatasetCompleto();
  }
  await aplicarQueryStrings(event);
}

const demandasParaExibir = computed(() => {
  if (datasetCompletoCarregado.value) {
    return todasDemandas.value;
  }
  return resumoDemandas.value;
});

const demandasFiltradas = computed(() => {
  let resultado = demandasParaExibir.value;

  if (route.query.orgao_id) {
    const ids = Array.isArray(route.query.orgao_id)
      ? route.query.orgao_id
      : [route.query.orgao_id];
    resultado = resultado.filter((d) => {
      const gmId = d.gestor_municipal?.id;
      return gmId != null && ids.includes(String(gmId));
    });
  }

  if (route.query.area_tematica_id) {
    const ids = Array.isArray(route.query.area_tematica_id)
      ? route.query.area_tematica_id
      : [route.query.area_tematica_id];
    resultado = resultado.filter((d) => {
      const atId = d.area_tematica?.id;
      return atId != null && ids.includes(String(atId));
    });
  }

  if (route.query.localizacao_id) {
    const ids = Array.isArray(route.query.localizacao_id)
      ? route.query.localizacao_id.map(String)
      : [String(route.query.localizacao_id)];

    resultado = resultado.filter((d) => d.geolocalizacao?.some((geo) => {
      const temNivel3 = geo.regioes?.nivel_3?.some((r) => ids.includes(String(r.id)));
      const temNivel4 = geo.regioes?.nivel_4?.some((r) => ids.includes(String(r.id)));
      return temNivel3 || temNivel4;
    }));
  }

  if (route.query.valor_min) {
    const min = parseFloat(route.query.valor_min);
    resultado = resultado.filter((d) => {
      const valor = parseFloat(d.valor);
      return !Number.isNaN(valor) && valor >= min;
    });
  }

  if (route.query.valor_max) {
    const max = parseFloat(route.query.valor_max);
    resultado = resultado.filter((d) => {
      const valor = parseFloat(d.valor);
      return !Number.isNaN(valor) && valor <= max;
    });
  }

  return resultado;
});

const marcadoresGeoJson = computed(() => geopontos.value
  .filter((ponto) => demandasFiltradas.value.some((d) => d.id === ponto.id))
  .map((ponto) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [ponto.longitude, ponto.latitude],
    },
    properties: {
      demanda_id: ponto.id,
      ...obterPropriedadesDemanda(ponto.id),
    },
  })));

const camadasParaMapa = computed(() => camadasGeo.value.map((camada) => ({
  id: camada.id,
  geom_geojson: camada.geom_geojson,
  config: {
    color: camada.cor || '#3388ff',
    fillOpacity: 0.2,
    weight: 2,
  },
})));
</script>

<template>
  <div class="portfolio-demandas">
    <!-- Cabeçalho -->
    <CabecalhoDePagina>
      <template #titulo>
        Portfólio de Demandas
      </template>
    </CabecalhoDePagina>

    <FormularioQueryString
      v-slot="{ aplicarQueryStrings }"
      :valores-iniciais="{}"
    >
      <form
        class="filtros-demandas mb2"
        @submit.prevent="aoSubmeterFiltros($event, aplicarQueryStrings)"
      >
        <div class="flex g2 flexwrap mb1">
          <div class="f1">
            <label
              class="label"
              for="orgao_id"
            >Gestor Municipal</label>
            <Field
              id="orgao_id"
              name="orgao_id"
              as="select"
              class="inputtext light"
            >
              <option value="">
                Selecione
              </option>
              <option
                v-for="orgao in filtros?.orgaos || []"
                :key="orgao.id"
                :value="orgao.id"
              >
                {{ orgao.nome_exibicao }}
              </option>
            </Field>
          </div>

          <div class="f1">
            <label
              class="label"
              for="area_tematica_id"
            >Área Temática</label>
            <Field
              id="area_tematica_id"
              name="area_tematica_id"
              as="select"
              class="inputtext light"
            >
              <option value="">
                Selecione
              </option>
              <option
                v-for="area in filtros?.areas_tematicas || []"
                :key="area.id"
                :value="area.id"
              >
                {{ area.nome }}
              </option>
            </Field>
          </div>

          <div class="f1">
            <label
              class="label"
              for="localizacao_id"
            >Subprefeitura/Distrito</label>
            <Field
              id="localizacao_id"
              name="localizacao_id"
              as="select"
              class="inputtext light"
            >
              <option value="">
                Selecione
              </option>
              <optgroup
                v-if="filtros?.localizacoes?.subprefeituras?.length"
                label="Subprefeituras"
              >
                <option
                  v-for="sub in filtros.localizacoes.subprefeituras"
                  :key="`sub-${sub.id}`"
                  :value="sub.id"
                >
                  {{ sub.descricao }}
                </option>
              </optgroup>
              <optgroup
                v-if="filtros?.localizacoes?.distritos?.length"
                label="Distritos"
              >
                <option
                  v-for="distrito in filtros.localizacoes.distritos"
                  :key="`dist-${distrito.id}`"
                  :value="distrito.id"
                >
                  {{ distrito.descricao }}
                </option>
              </optgroup>
            </Field>
          </div>
        </div>

        <div class="flex g2 flexwrap">
          <div class="f1">
            <label class="label">Valor</label>
            <SmaeRangeInput
              v-if="filtros?.valor_range"
              name-min="valor_min"
              name-max="valor_max"
              :min="parseFloat(filtros.valor_range.min)"
              :max="parseFloat(filtros.valor_range.max)"
              mostrar-inputs
            />
          </div>

          <div class="f2 flex flexwrap center justifyright">
            <button
              type="submit"
              class="btn"
            >
              Pesquisar
            </button>
          </div>
        </div>
      </form>
    </FormularioQueryString>

    <section class="mb2">
      <LoadingComponent v-if="chamadasPendentes.geocamadas || chamadasPendentes.geopontos">
        Carregando mapa...
      </LoadingComponent>

      <MapaExibir
        v-else
        :geo-json="marcadoresGeoJson"
        :camadas="camadasParaMapa"
        height="500px"
      >
        <template #painel-flutuante="dados">
          <p
            v-if="dados.nome_projeto"
            class="painel-flutuante__titulo"
          >
            {{ dados.nome_projeto }}
          </p>

          <dl
            v-if="dados.finalidade || dados.valor"
            class="dl-full-width"
          >
            <div v-if="dados.finalidade">
              <dt>Finalidade</dt>
              <dd>{{ dados.finalidade }}</dd>
            </div>
            <div v-if="dados.valor">
              <dt>Valor</dt>
              <dd>{{ dinheiro(dados.valor, { style: 'currency', currency: 'BRL' }) }}</dd>
            </div>
          </dl>
        </template>
      </MapaExibir>
    </section>

    <CardEnvelope.Conteudo class="flex column g2">
      <CardEnvelope.Titulo titulo="Demandas" />

      <LoadingComponent v-if="chamadasPendentes.resumo">
        Carregando demandas...
      </LoadingComponent>

      <LoadingComponent v-else-if="chamadasPendentes.completo">
        Carregando resultados completos...
      </LoadingComponent>

      <ErrorComponent v-else-if="erro">
        {{ erro }}
      </ErrorComponent>

      <div
        v-else-if="!demandasFiltradas.length"
        class="empty-state"
      >
        <p>Nenhuma demanda encontrada com os filtros selecionados.</p>
      </div>

      <SmaeTable
        v-else
        :colunas="colunasDemandas"
        :dados="demandasFiltradas"
        rolagem-horizontal
        titulo-para-rolagem-horizontal="Demandas"
      >
        <template #celula:acao="{ linha }">
          <SmaeLink
            :to="{ name: 'demandaPublica', params: { id: linha.id } }"
            class="tprimary"
            title="Visualizar demanda"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_eye" /></svg>
          </SmaeLink>
        </template>
      </SmaeTable>
    </CardEnvelope.Conteudo>
  </div>
</template>

<style lang="less" scoped>
@import '@/_less/variables.less';

.portfolio-demandas {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.filtros-demandas {
  padding: 1.5rem;
  .br(4px);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: @c400;
}
</style>
