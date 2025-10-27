<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import BuscadorGeolocalizacaoFiltro from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoFiltro.vue';
import BuscadorGeolocalizacaoListagem from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoListagem.vue';
import BuscadorGeolocalizacaoMapa from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoMapa.vue';
import titleCase from '@/helpers/texto/titleCase';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import type { PontoEndereco } from '@/stores/geolocalizador.store';

const entidadesProximasStore = useEntidadesProximasStore();

const { proximidadeFormatada } = storeToRefs(entidadesProximasStore);

async function buscarProximidade(endereco: PontoEndereco, raio = 2) {
  if (!endereco) {
    console.error('Endereço não encontrado', endereco);
    return;
  }

  const [camada] = endereco.camadas;
  if (!camada.codigo) {
    console.error('Camada.Codigo não encontrado', camada);
    return;
  }

  if (
    !endereco.endereco.geometry.coordinates[0]
    || !endereco.endereco.geometry.coordinates[1]
  ) {
    console.error('Coordenadas não encontradas', endereco.endereco.geometry);
    return;
  }

  const [lon, lat] = endereco.endereco.geometry.coordinates;

  entidadesProximasStore.$reset();

  await entidadesProximasStore.buscarPorLocalizacao({
    geo_camada_codigo: camada.codigo,
    lat,
    lon,
  }, raio);
}

const localizacoes = computed(() => proximidadeFormatada.value.reduce((agrupador, i) => {
  if (!i.localizacoes?.length) {
    return agrupador;
  }

  const dados = i.localizacoes[0].geom_geojson;

  if (!dados.properties) {
    dados.properties = {};
  }

  dados.properties.camposComplementares = {} as Record<string, unknown>;

  ['nome', 'status'].forEach((campo) => {
    if (Object.hasOwn(i, campo)) {
      // eslint-disable-next-line max-len
      (dados.properties.camposComplementares as Record<string, unknown>)[campo] = i[campo as keyof typeof i];
    }
  });

  agrupador.push(dados);
  return agrupador;
}, []));

</script>

<template>
  <div class="flex g2 flexwrap">
    <div class="f1 fb40 flex column g1">
      <BuscadorGeolocalizacaoFiltro />

      <BuscadorGeolocalizacaoListagem
        @selecao="(ev) => buscarProximidade(ev.endereco, ev.raio)"
      />
    </div>

    <BuscadorGeolocalizacaoMapa
      class="f1 fb50 align-stretch"
      height="48rem"
      :localizacoes="localizacoes"
    >
      <template #painel-flutuante="dados">
        <template v-if="dados.camposComplementares">
          <p class="painel-flutuante__titulo">
            {{ titleCase(dados.camposComplementares.nome) }}
          </p>

          <dl>
            <div>
              <dt>
                Endereço
              </dt>

              <dd>{{ dados.string_endereco }}</dd>
            </div>

            <div v-if="dados.camposComplementares.status">
              <dt>
                Status
              </dt>

              <dd class="painel-flutuante__item-com-legenda">
                {{ dados.camposComplementares.status.nome || dados.camposComplementares.status }}
              </dd>
            </div>
          </dl>
        </template>

        <template v-else>
          <p class="painel-flutuante__titulo">
            {{ titleCase(dados.titulo) }}
          </p>
        </template>
      </template>
    </BuscadorGeolocalizacaoMapa>
  </div>
</template>
