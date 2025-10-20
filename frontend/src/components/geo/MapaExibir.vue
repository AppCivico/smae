<template>
  <KeepAlive>
    <div
      v-once
      v-bind="$attrs"
      ref="elementoMapa"
      class="mapa br8"
      :style="{
        height: alturaCorrente || $props.height,
        minHeight: $props.height
      }"
      @ready="mapReady"
    />
  </KeepAlive>
  <!-- @link https://stackoverflow.com/a/51033863/15425845 -->
  <div
    ref="elementoPainelFlutuante"
    class="painel-flutuante__conteudo"
    hidden
  >
    <component :is="() => conteudoPainelFlutuante" />
  </div>
</template>
<script setup>
import sombraDoMarcador from '@/assets/icons/mapas/map-pin__sombra.svg';
import { gerarSvgMarcador } from '@/helpers/gerarSvgMarcador';
import { useRegionsStore } from '@/stores/regions.store';
import { useResizeObserver } from '@vueuse/core';
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet/dist/leaflet.css';
import { debounce, merge } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  defineEmits,
  defineOptions,
  defineProps,
  nextTick,
  onMounted,
  ref,
  useSlots,
  watch,
} from 'vue';

/**
 * Converte SVG string para Data URL para uso com Leaflet icons
 * @param {string} svgString - String SVG
 * @returns {string} Data URL
 */
function svgParaDataUrl(svgString) {
  const encodedSvg = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encodedSvg}`;
}

defineOptions({ inheritAttrs: false });

const RegionsStore = useRegionsStore();

const { camadas } = storeToRefs(RegionsStore);

let marcadorNoMapa = null;
const polígonosNoMapa = [];
const geoJsonsNoMapa = [];

const grupoDeElementosNoMapa = () => L.featureGroup(
  []
    .concat(polígonosNoMapa)
    .concat(geoJsonsNoMapa),
);

const elementoPainelFlutuante = ref(null);
const conteudoPainelFlutuante = ref(null);
const elementoMapa = ref(null);
const alturaCorrente = ref();

let grupoDeMarcadores = null;
let mapa;

// marcadores atualizam separado do v-model para:
// - deixar útil para diferentes situações;
// - evitar atualizações recursivas
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  height: {
    type: String,
    default: '32rem',
    validator: (value) => value.match(/^\d+(px|rem|em|vh|vw)$/),
  },
  // @see https://leafletjs.com/reference.html#tooltip-option
  opcoesDoPainelFlutuante: {
    type: Object,
    default: () => ({
    }),
  },
  agruparMarcadores: {
    type: Boolean,
  },
  // aceitar tanto um par de coordenadas em forma de array,
  // quanto um objeto já com:
  // - coordenadas;
  // - opções, no formato https://leafletjs.com/reference.html#marker-option
  marcador: {
    type: [
      Array,
      Object,
    ],
    default: null,
  },
  // opções para o marcador, se for mais fácil mandar separado
  opçõesDoMarcador: {
    type: Object,
    default: null,
  },
  // opções para o plug-in `leaflet.markercluster`
  opcoesDeAgrupamento: {
    type: Object,
    default: () => ({
    }),
  },
  // disparam busca na API
  camadas: {
    type: Array,
    default: () => [],
  },
  // puros! Não disparam busca na API
  polígonos: {
    type: Array,
    default: () => [],
  },
  // opções para os polígonos, se for mais fácil mandar separado
  opçõesDoPolígono: {
    type: Object,
    default: null,
  },
  permitirAdição: {
    type: Boolean,
    default: false,
  },
  latitude: {
    type: [Number, String],
    // marco zero de São Paulo
    default: -23.55040,
  },
  longitude: {
    type: [Number, String],
    // marco zero de São Paulo
    default: -46.63395,
  },
  zoom: {
    type: [Number, String],
    default: 13,
  },
  // opções para o mapa
  opçõesDoMapa: {
    type: Object,
    default: null,
  },
  geoJson: {
    type: [Array, Object],
    default: () => [],
  },
});

const emits = defineEmits([
  'marcadorFoiMovido',
  'update:modelValue',
]);

const slots = useSlots();

function adicionarMarcadorNoPonto(e) {
  // PRA-FAZER: não funciona ainda!
  if (e.latlng !== undefined) {
    const { lat, lng } = e.latlng;
    emits('update:modelValue', [lat, lng]);
  }
}

function moverMarcador(e) {
  if (e.latlng !== undefined) {
    const { lat, lng } = e.latlng;
    emits('update:modelValue', [lat, lng]);
  } else {
    console.error('propriedade latLng ausente do evento');
  }
}

function marcadorFoiMovido() {
  emits('marcadorFoiMovido', props.modelValue);
}

function atribuirPainelFlutuante(item, dados = null, opcoes = null) {
  let conteudo;
  switch (true) {
    case !!slots['painel-flutuante']:
      conteudo = () => {
        // ocultar e reexibir o elemento para forçar a atualização da sua posição
        elementoPainelFlutuante.value.setAttribute('hidden', '');
        conteudoPainelFlutuante.value = slots['painel-flutuante'](dados);

        nextTick(() => {
          if (elementoPainelFlutuante.value.hasAttribute('hidden')) {
            elementoPainelFlutuante.value.removeAttribute('hidden');
          }
        });

        return elementoPainelFlutuante.value;
      };
      break;
    case !!dados?.titulo:
      conteudo = dados.titulo;
      break;
    case !!dados?.rotulo && !!dados?.descricao:
      conteudo = `<strong>${dados.rotulo}</strong><br/>${dados.descricao}`;
      break;
    case !!dados?.rotulo && !!dados?.string_endereco:
      conteudo = `<strong>${dados.rotulo}</strong><br/>${dados.string_endereco}`;
      break;
    case !!dados?.rotulo || !!dados?.string_endereco:
      conteudo = dados?.rotulo || dados?.string_endereco;
      break;
    default:
      break;
  }

  if (conteudo) {
    item.bindTooltip(conteudo, {
      direction: 'auto',
      className: 'painel-flutuante',
      sticky: true,
      ...props.opcoesDoPainelFlutuante,
      ...opcoes,
    });
  }
}

// aceitar uma lista de marcadores, ao invés de um só, para a gente poder
// identificar um entre muitos marcadores (no futuro)
function criarMarcadores(marcadores = []) {
  marcadores.forEach((marcador, i) => {
    if (marcador.coordenadas || Array.isArray(marcador)) {
      const opções = { ...props.opçõesDoMarcador, ...marcador.opções };

      marcadorNoMapa = marcador.coordenadas
        ? L.marker(marcador?.coordenadas, opções)
        : L.marker(marcador, props.opçõesDoMarcador);

      atribuirPainelFlutuante(marcadorNoMapa, marcador);

      if (opções.draggable) {
        marcadorNoMapa.on('move', moverMarcador);
        marcadorNoMapa.on('moveend', marcadorFoiMovido);
      }
      // aqui a gente dá "nome" para poder identificar o marcador.
      // Poderia ser um nome melhor, né?
      marcadorNoMapa.índice = i;

      if (props.agruparMarcadores) {
        grupoDeMarcadores.addLayer(marcadorNoMapa);
      } else {
        marcadorNoMapa.addTo(mapa);
      }
    }
  });

  if (props.agruparMarcadores) {
    mapa.addLayer(grupoDeMarcadores);
  }
}

function criarGeoJson(dados) {
  let geoJson;

  if (dados.geometry?.type === 'Point') {
    // Determinar a cor do marcador baseado nas propriedades
    let corDoMarcador;

    if (dados.properties?.cor_do_marcador) {
      // Suporta string nomeada ('vermelho', 'laranja', 'verde')
      corDoMarcador = dados.properties.cor_do_marcador;
    } else if (dados.properties?.cor_preenchimento || dados.properties?.cor_contorno) {
      // Suporta cores personalizadas via propriedades separadas
      corDoMarcador = {
        fill: dados.properties.cor_preenchimento,
        stroke: dados.properties.cor_contorno,
      };
    } else if (dados.properties?.cores_marcador) {
      // Suporta objeto com fill/stroke
      corDoMarcador = dados.properties.cores_marcador;
    }

    const svgMarcador = gerarSvgMarcador(corDoMarcador);
    const urlDoÍcone = svgParaDataUrl(svgMarcador);

    const ícone = L.icon({
      iconUrl: urlDoÍcone,
      iconAnchor: [24, 42],
      shadowUrl: sombraDoMarcador,
      shadowSize: [48, 48],
      iconSize: [48, 48],
    });

    geoJson = L.geoJSON(dados, {
      pointToLayer: (_geoJsonPoint, latlng) => L.marker(latlng, { icon: ícone }),
    });

    atribuirPainelFlutuante(geoJson, dados?.properties);

    if (props.agruparMarcadores) {
      grupoDeMarcadores.addLayer(geoJson);
    } else {
      geoJson.addTo(mapa);
    }
  } else {
    geoJson = L.geoJSON(dados);

    // o painel flutuante não pode ser adicionado depois da inserção no cluster
    atribuirPainelFlutuante(geoJson, dados?.properties);

    geoJson.addTo(mapa);
  }

  geoJsonsNoMapa.push(geoJson);
}

function prepararGeoJsonS(items) {
  geoJsonsNoMapa.forEach((item) => {
    item.remove();
  });

  if (grupoDeMarcadores) {
    grupoDeMarcadores.clearLayers();
  }

  const listaDeItens = Array.isArray(items)
    ? items
    : [items];

  if (listaDeItens.length) {
    listaDeItens.forEach((item) => { criarGeoJson(item); });

    // ativar o agrupamento aqui, porque ele deve ser do array completo, mas a
    // inserção de geoJSONs tem que ser um por um, porque podem ser de vários tipos
    if (props.agruparMarcadores) {
      mapa.addLayer(grupoDeMarcadores);
    }

    mapa.fitBounds(grupoDeElementosNoMapa().getBounds());
  }
}

function criarPolígono(dadosDoPolígono) {
  let config = {};

  // mapear propriedade para manter compatibilidade com o backend
  if (dadosDoPolígono.config?.cor) {
    config.color = dadosDoPolígono.config?.cor;
  }

  config = {
    config,
    // mapear propriedade para manter compatibilidade com o backend
    ...props.opçõesDoPolígono,
    ...dadosDoPolígono.config,
  };

  const polígono = dadosDoPolígono.geom_geojson
    ? L.geoJSON(dadosDoPolígono.geom_geojson, config).addTo(mapa)
    : L.polygon(dadosDoPolígono.coordenadas, config).addTo(mapa);
  polígono.id = dadosDoPolígono.id;

  atribuirPainelFlutuante(polígono, dadosDoPolígono);

  polígonosNoMapa.push(polígono);
}

function chamarDesenhoDePolígonosNovos(polígonos) {
  const idsNovos = polígonos
    .reduce((acc, cur) => { if (cur.id) { acc[cur.id] = true; } return acc; }, {});

  for (let i = 0; i < polígonosNoMapa.length; i += 1) {
    if (polígonosNoMapa[i].id && !idsNovos[polígonosNoMapa[i].id]) {
      polígonosNoMapa[i].remove();
    } else {
      idsNovos[polígonosNoMapa[i]] = undefined;
    }
  }

  for (let i = 0; i < polígonos.length; i += 1) {
    const polígono = polígonos[i];
    if (!polígono.id || idsNovos[polígono.id]) {
      criarPolígono(polígono);
    }
  }
}

async function prepararCamadas(camadasFornecidas = props.camadas) {
  const camadasABuscar = camadasFornecidas.reduce((acc, cur) => (!camadas?.value?.[cur.id]
    ? acc.concat([cur.id])
    : acc), []);

  if (camadasABuscar.length) {
    await RegionsStore.buscarCamadas({
      camada_ids: camadasFornecidas.map((x) => x.id),
    });
  }

  const camadasSelecionadas = camadasFornecidas
    .reduce((acc, cur) => (camadas?.value?.[cur.id]?.geom_geojson?.geometry.type === 'Polygon'
      ? acc.concat({
        ...camadas?.value?.[cur.id],
        config: merge({}, camadas?.value?.[cur.id].config, cur.config),
      })
      : acc), []);
  chamarDesenhoDePolígonosNovos(camadasSelecionadas);
}

async function iniciarMapa(element) {
  // prevenir recarregar o mapa inteiro em alguma trapalhada com a redefinição
  // desse componente
  if (mapa) {
    return;
  }

  if (props.agruparMarcadores) {
    grupoDeMarcadores = L.markerClusterGroup(props.opcoesDeAgrupamento);
  }

  mapa = L
    .map(element, {
      scrollWheelZoom: false,
      ...props.opçõesDoMapa,
    })
    .setView([Number(props.latitude), Number(props.longitude)], Number(props.zoom));

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);

  const svgMarcadorPadrão = gerarSvgMarcador('padrão');
  L.Marker.prototype.options.icon = L.icon({
    iconUrl: svgParaDataUrl(svgMarcadorPadrão),
    iconSize: [48, 48],
    shadowUrl: sombraDoMarcador,
    iconAnchor: [24, 42],
    shadowSize: [48, 48],
  });

  if (!props.opçõesDoMapa?.scrollWheelZoom) {
    mapa.on('focus', () => { mapa.scrollWheelZoom.enable(); });
    mapa.on('blur', () => { mapa.scrollWheelZoom.disable(); });
  }

  if (grupoDeMarcadores) {
    grupoDeMarcadores.clearLayers();
  }

  if (props.marcador) {
    criarMarcadores([props.marcador]);
  }

  if (props.marcadores?.length) {
    criarMarcadores(props.marcadores);
  }

  if (props.geoJson) {
    if (Array.isArray(props.geoJson)) {
      prepararGeoJsonS(props.geoJson);
    } else {
      prepararGeoJsonS([props.geoJson]);
    }
  }

  for (let i = 0; i < props.polígonos.length; i += 1) {
    criarPolígono(props.polígonos[i]);
  }

  if (props.camadas.length) {
    await prepararCamadas(props.camadas);
  }
}

function mapReady(loadedMap) {
  // PRA-FAZER: não funciona ainda!
  loadedMap.on('click', adicionarMarcadorNoPonto);
}

function removerMapa() {
  if (mapa) {
    mapa.remove();
    mapa = undefined;
  }
}

const observer = new IntersectionObserver((entries) => {
  if (!mapa) {
    if (entries[0].isIntersecting === true && elementoMapa.value) {
      iniciarMapa(elementoMapa.value).then(() => {
        nextTick(() => {
          const limites = grupoDeElementosNoMapa().getBounds();

          if (limites.isValid()) {
            mapa.fitBounds(limites, { animate: true });
          }
        });
      });
    }
  }
}, { threshold: [0.25] });

useResizeObserver(elementoMapa, debounce(async (entries) => {
  const entry = entries[0];
  const { height } = entry.contentRect;

  alturaCorrente.value = `${height}px`;

  nextTick(() => {
    if (mapa) {
      const limites = grupoDeElementosNoMapa().getBounds();

      if (limites.isValid()) {
        mapa.fitBounds(limites, { animate: true });
      }
    }
  });
}, 400));

onMounted(() => {
  if (elementoMapa.value) {
    observer.observe(elementoMapa.value);
  } else {
    console.error('Error: elementoMapa not available');
  }
});

watch(() => props.geoJson, (valorNovo) => {
  if (mapa) {
    prepararGeoJsonS(valorNovo);
  }
});

watch(() => props.camadas, async (valorNovo) => {
  if (mapa) {
    await prepararCamadas(valorNovo);
  }
});

watch(() => props.marcador, (valorNovo) => {
  if (marcadorNoMapa) {
    marcadorNoMapa.remove();
  }

  if (grupoDeMarcadores) {
    grupoDeMarcadores.clearLayers();
  }

  if (mapa) {
    criarMarcadores([valorNovo]);
    mapa.panTo(valorNovo);
  }
});

watch(() => props.polígonos, (valorNovo) => {
  if (mapa) {
    chamarDesenhoDePolígonosNovos(valorNovo);
  }
});
</script>
<style lang="less">
.mapa {
  flex-grow: 1;

  &:focus {
    outline: 1px solid @c400;
    outline-style: solid !important;
  }
}

.leaflet-interactive:focus {
  outline: 0;
  stroke-opacity: 0.85;
}
</style>
