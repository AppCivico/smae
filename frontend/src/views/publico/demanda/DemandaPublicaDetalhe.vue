<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, ref, watch,
} from 'vue';

import ErrorComponent from '@/components/ErrorComponent.vue';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import dinheiro from '@/helpers/dinheiro';
import requestS from '@/helpers/requestS';
import { useDemandaPublicaStore } from '@/stores/demandaPublica.store';

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
});

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const demandaPublicaStore = useDemandaPublicaStore();
const { emFoco: demanda } = storeToRefs(demandaPublicaStore);

const camadasGeo = ref([]);
const chamadasPendentes = ref({
  emFoco: false,
  geocamadas: false,
});
const erro = ref(null);

function obterAreaTematicaComAcoes(demandaItem) {
  if (!demandaItem.area_tematica?.nome) {
    return undefined;
  }
  if (demandaItem.acoes?.length) {
    const acoesList = combinadorDeListas(demandaItem.acoes, ', ', 'nome');
    return `${demandaItem.area_tematica.nome} - Ações: ${acoesList}`;
  }
  return demandaItem.area_tematica.nome;
}

const dadosDemanda = computed(() => {
  if (!demanda.value) return [];

  const dados = [
    {
      chave: 'gestor_municipal',
      titulo: 'Gestor Municipal',
      valor: demanda.value.gestor_municipal?.nome_exibicao,
      larguraBase: '20em',
    },
    {
      chave: 'nome_projeto',
      titulo: 'Nome do Projeto',
      valor: demanda.value.nome_projeto,
      larguraBase: '20em',
    },
    {
      chave: 'descricao',
      titulo: 'Descrição',
      valor: demanda.value.descricao,
      larguraBase: '100%',
    },
    {
      chave: 'justificativa',
      titulo: 'Justificativa',
      valor: demanda.value.justificativa,
      larguraBase: '100%',
    },
    {
      chave: 'area_tematica',
      titulo: 'Área Temática',
      valor: obterAreaTematicaComAcoes(demanda.value),
      larguraBase: '20em',
    },
  ];

  dados.push(
    {
      chave: 'valor',
      titulo: 'Valor',
      valor: dinheiro(demanda.value.valor, {
        style: 'currency',
        currency: 'BRL',
      }),
    },
    {
      chave: 'finalidade',
      titulo: 'Finalidade',
      valor: demanda.value.finalidade,
    },
  );

  if (demanda.value.observacao) {
    dados.push({
      chave: 'observacao',
      titulo: 'Observação',
      valor: demanda.value.observacao,
      larguraBase: '100%',
    });
  }

  return dados;
});

function urlImagem(arquivoItem) {
  const { arquivo } = arquivoItem;

  const token = arquivo.preview?.status === 'concluido' && arquivo.preview.download_token
    ? arquivo.preview.download_token
    : arquivo.download_token;

  return `${baseUrl}/public/arquivos/${token}`;
}

async function buscarDemanda() {
  chamadasPendentes.value.emFoco = true;
  erro.value = null;

  try {
    await demandaPublicaStore.buscarItem(props.id);
    if (!demanda.value) {
      erro.value = 'Demanda não encontrada.';
    }
  } catch (e) {
    erro.value = 'Não foi possível carregar as informações da demanda.';
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar demanda pública:', e);
  } finally {
    chamadasPendentes.value.emFoco = false;
  }
}

async function buscarGeoCamadas() {
  chamadasPendentes.value.geocamadas = true;

  try {
    const resposta = await requestS.get(
      `${baseUrl}/public/demandas/geocamadas`,
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

const marcadoresGeoJson = computed(() => {
  if (!demanda.value?.geolocalizacao?.length) {
    return [];
  }

  const features = [];

  demanda.value.geolocalizacao.forEach((geo) => {
    if (geo.endereco?.geometry?.coordinates) {
      features.push({
        ...geo.endereco, // Já é GeoJSON
        properties: {
          ...geo.endereco.properties,
          // tooltip
          rotulo: demanda.value.nome_projeto,
        },
      });
    }
  });

  return features;
});

const camadasParaMapa = computed(() => {
  if (!demanda.value?.geolocalizacao?.length) {
    return [];
  }

  const camadasIds = new Set();

  demanda.value.geolocalizacao.forEach((geo) => {
    geo.camadas?.forEach((camada) => {
      camadasIds.add(camada.id);
    });
  });

  return camadasGeo.value
    .filter((camada) => camadasIds.has(camada.id))
    .map((camada) => ({
      id: camada.id,
      geom_geojson: camada.geom_geojson,
      config: {
        color: camada.cor || '#3388ff',
        fillOpacity: 0.2,
        weight: 2,
      },
    }));
});

function formatarEndereco(geo) {
  const enderecoProps = geo.endereco?.properties;
  if (!enderecoProps) return geo.endereco_exibicao || '';

  const partes = [];

  if (enderecoProps.rua) {
    partes.push(enderecoProps.numero ? `${enderecoProps.rua}, ${enderecoProps.numero}` : enderecoProps.rua);
  }

  if (enderecoProps.bairro) {
    partes.push(enderecoProps.bairro);
  }

  const cidadeEstado = [];
  if (enderecoProps.cidade) {
    cidadeEstado.push(enderecoProps.cidade);
  }
  if (enderecoProps.estado) {
    const siglaEstado = enderecoProps.codigo_estado || enderecoProps.estado;
    cidadeEstado.push(siglaEstado);
  }
  if (cidadeEstado.length > 0) {
    partes.push(cidadeEstado.join(' - '));
  }

  if (enderecoProps.cep) {
    partes.push(enderecoProps.cep);
  }

  return partes.join(', ');
}

function carregarDados() {
  demandaPublicaStore.emFoco = null;
  erro.value = null;
  camadasGeo.value = [];

  buscarDemanda();
  buscarGeoCamadas();
}

onMounted(() => {
  carregarDados();
});

watch(() => props.id, () => {
  carregarDados();
});
</script>

<template>
  <LoadingComponent v-if="chamadasPendentes.emFoco" />
  <ErrorComponent
    v-else-if="erro"
  >
    {{ erro }}
  </ErrorComponent>
  <div
    v-else-if="demanda"
    class="demanda-publica"
  >
    <MigalhasDePão class="mb1" />

    <CabecalhoDePagina class="mb2" />

    <SmaeDescriptionList :lista="dadosDemanda" />

    <div class="flex column g2">
      <section
        v-if="demanda.arquivos?.length"
        class="demanda-publica__secao"
      >
        <div class="demanda-publica__galeria">
          <div
            v-for="arquivo in demanda.arquivos"
            :key="arquivo.id"
            class="demanda-publica__imagem-container"
          >
            <img
              :src="urlImagem(arquivo)"
              :alt="arquivo.descricao || 'Imagem da demanda'"
              class="demanda-publica__imagem"
            >
          </div>
        </div>
      </section>

      <section
        v-if="demanda.geolocalizacao?.length"
        class="demanda-publica__secao"
      >
        <LoadingComponent v-if="chamadasPendentes.geocamadas" />

        <template v-else>
          <p
            v-for="geo in demanda.geolocalizacao"
            :key="geo.token"
            class="flex g05"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_map_pin" /></svg>

            {{ formatarEndereco(geo) }}
          </p>

          <MapaExibir
            :geo-json="marcadoresGeoJson"
            :camadas="camadasParaMapa"
            height="500px"
          />
        </template>
      </section>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '@/_less/variables.less';

.demanda-publica__galeria {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.demanda-publica__imagem-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.demanda-publica__imagem {
  width: 100%;
  height: 19rem;
  object-fit: cover;
  .br(16px);
  .bs(0 2px 8px rgba(0, 0, 0, 0.1));
}
</style>
