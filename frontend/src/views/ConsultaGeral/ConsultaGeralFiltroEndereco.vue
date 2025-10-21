<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import BuscadorGeolocalizacaoMapa from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoMapa.vue';
import BuscadorGeolocalizacaoFiltro from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoFiltro.vue';
import BuscadorGeolocalizacaoListagem from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoListagem.vue';
import type { PontoEndereco } from '@/stores/geolocalizador.store';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import titleCase from '@/helpers/texto/titleCase';

const entidadesProximasStore = useEntidadesProximasStore();

const { proximidadeFormatada } = storeToRefs(entidadesProximasStore);

async function buscarProximidade(endereco: PontoEndereco) {
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
  });
}

const localizacoes = computed(() => proximidadeFormatada.value.reduce((agrupador, i) => {
  if (!i.localizacoes?.length) {
    return agrupador;
  }

  const dados = i.localizacoes[0].geom_geojson;

  if (!dados.properties) {
    dados.properties = {};
  }

  dados.properties.camposComplementares = {};

  ['nome', 'status'].forEach((campo) => {
    if (i[campo] !== undefined) {
      dados.properties.camposComplementares[campo] = i[campo];
    }
  });

  agrupador.push(dados);
  return agrupador;
}, []));

</script>

<template>
  <div class="flex g2 flexwrap">
    <div class="f1 fb40">
      <BuscadorGeolocalizacaoFiltro />

      <BuscadorGeolocalizacaoListagem @selecao="buscarProximidade" />
    </div>

    <BuscadorGeolocalizacaoMapa
      class="f1 fb50"
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

            <div>
              <dt>
                Status
              </dt>

              <dd class="painel-flutuante__item-com-legenda">
                {{ dados.camposComplementares.status.nome }}
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
    </BuscadorgeolocalizacaoMapa>
  </div>
</template>
