<script lang="ts" setup>
import BuscadorGeolocalizacaoMapa from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoMapa.vue';
import BuscadorGeolocalizacaoFiltro from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoFiltro.vue';
import BuscadorGeolocalizacaoListagem from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoListagem.vue';
import { useGeolocalizadorStore, PontoEndereco } from '@/stores/geolocalizador.store';
import titleCase from '@/helpers/texto/titleCase';

const geolocalizadorStore = useGeolocalizadorStore();

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

  await geolocalizadorStore.buscaProximidades({
    geo_camada_codigo: camada.codigo,
    lat,
    lon,
  });
}

</script>

<template>
  <div class="flex g2 flexwrap">
    <div class="f1 fb40">
      <BuscadorGeolocalizacaoFiltro />

      <BuscadorGeolocalizacaoListagem @selecao="buscarProximidade" />
    </div>

    <BuscadorGeolocalizacaoMapa
      class="f1 fb50"
      :campos-complementares="['nome', 'status']"
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
    </Buscadorgeolocalizacaomapa>
  </div>
</template>
