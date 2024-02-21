<template>
  <KeepAlive>
    <div
      v-once
      ref="elementoMapa"
      class="mapa br8"
      @ready="mapReady"
    />
  </KeepAlive>
</template>
<script setup>
import {
  ref, onMounted, defineProps, defineEmits, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRegionsStore } from '@/stores/regions.store';
// prevenir erro de encapsulamento do Vite
// https://cescobaz.com/2023/06/14/setup-leaflet-with-svelte-and-vite/
import markerIconUrl from '@/../node_modules/leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from '@/../node_modules/leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from '@/../node_modules/leaflet/dist/images/marker-shadow.png';

const RegionsStore = useRegionsStore();

const { camadas } = storeToRefs(RegionsStore);

let marcadorNoMapa = null;
const polígonosNoMapa = [];
const elementoMapa = ref(null);
let mapa;
// marcadores atualizam separado do v-model para:
// - deixar útil para diferentes situações;
// - evitar atualizações recursivas
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
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
    required: true,
    // marco zero de São Paulo
    default: -23.55040,
  },
  longitude: {
    type: [Number, String],
    required: true,
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
});

const emits = defineEmits(['update:modelValue']);

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
// aceitar uma lista de marcadores, ao invés de um só, para a gente poder
// identificar um entre muitos marcadores (no futuro)
function criarMarcadores(marcadores = []) {
  marcadores.forEach((marcador, i) => {
    if (marcador.coordenadas || Array.isArray(marcador)) {
      const opções = { ...props.opçõesDoMarcador, ...marcador.opções };

      marcadorNoMapa = marcador.coordenadas
        ? L.marker(marcador?.coordenadas, opções)
        : L.marker(marcador, props.opçõesDoMarcador);

      if (opções.draggable) {
        marcadorNoMapa.on('move', moverMarcador);
      }
      // aqui a gente dá "nome" para poder identificar o marcador.
      // Poderia ser  um nome melhor, né?
      marcadorNoMapa.índice = i;
      marcadorNoMapa.addTo(mapa);
    }
  });
}

function criarPolígono(dadosDoPolígono) {
  const opções = {
    ...props.opçõesDoPolígono,
  };

  if (dadosDoPolígono.config?.cor) {
    opções.color = dadosDoPolígono.config?.cor;
  }

  const polígono = dadosDoPolígono.geom_geojson
    ? L.geoJSON(dadosDoPolígono.geom_geojson, opções).addTo(mapa)
    : L.polygon(dadosDoPolígono.coordenadas, opções).addTo(mapa);
  polígono.id = dadosDoPolígono.id;

  if (dadosDoPolígono.titulo) {
    polígono.bindTooltip(dadosDoPolígono.titulo, {
      permanent: true, direction: 'center',
    });
  }

  polígonosNoMapa.push(polígono.id);
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
    await RegionsStore.buscarCamadas(camadasFornecidas.map((x) => x.id));
  }

  const camadasSelecionadas = camadasFornecidas
    .reduce((acc, cur) => (camadas?.value?.[cur.id]?.geom_geojson?.geometry.type === 'Polygon'
      ? acc.concat(camadas?.value?.[cur.id])
      : acc), []);
  chamarDesenhoDePolígonosNovos(camadasSelecionadas);
}

async function iniciarMapa(element) {
  // prevenir recarregar o mapa inteiro em alguma trapalhada com a redefinição
  // desse componente
  if (mapa) {
    return;
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

  // prevenir erro de encapsulamento do Vite
  // https://cescobaz.com/2023/06/14/setup-leaflet-with-svelte-and-vite/
  L.Icon.Default.prototype.options.iconUrl = markerIconUrl;
  L.Icon.Default.prototype.options.iconRetinaUrl = markerIconRetinaUrl;
  L.Icon.Default.prototype.options.shadowUrl = markerShadowUrl;
  L.Icon.Default.imagePath = '';

  if (!props.opçõesDoMapa?.scrollWheelZoom) {
    mapa.on('focus', () => { mapa.scrollWheelZoom.enable(); });
    mapa.on('blur', () => { mapa.scrollWheelZoom.disable(); });
  }

  if (props.marcador) {
    criarMarcadores([props.marcador]);
  }

  for (let i = 0; i < props.polígonos.length; i += 1) {
    criarPolígono(props.polígonos[i]);
  }

  if (props.camadas.length) {
    await prepararCamadas(props.camadas);

    chamarDesenhoDePolígonosNovos(props.camadas);
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
  if (entries[0].isIntersecting === true && elementoMapa.value) {
    removerMapa();
    iniciarMapa(elementoMapa.value);
  }
}, { threshold: [1] });

onMounted(() => {
  if (elementoMapa.value) {
    observer.observe(elementoMapa.value);
  } else {
    console.error('Error: elementoMapa not available');
  }
});

watch(() => props.camadas, async (valorNovo) => {
  await prepararCamadas(valorNovo);
});

watch(() => props.marcador, (valorNovo) => {
  if (marcadorNoMapa) {
    marcadorNoMapa.remove();
  }
  if (mapa) {
    criarMarcadores([valorNovo]);
    mapa.panTo(valorNovo);
  }
});

watch(() => props.polígonos, (valorNovo) => {
  chamarDesenhoDePolígonosNovos(valorNovo);
});
</script>
<style lang="less">
.mapa {
  height: 24rem;

  &:focus {
    outline: 1px solid @c400;
    outline-style: solid !important;
  }
}
</style>
