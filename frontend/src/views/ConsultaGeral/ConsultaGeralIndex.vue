<script lang="ts" setup>
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import BuscadorGeolocalizacao from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoIndex.vue';
import { useGeolocalizadorStore, PontoEndereco } from '@/stores/geolocalizador.store';

const dados = [
  {
    endereco: 'AVENIDA FERNANDO ESPÍRITO SANTO ALVES DE MATTOS, 1000',
    programa: 'Monitoramento de Obras 2021/2024 - SEHAB',
    projeto: 'Copa do povo - Gleba A',
    responsavel: ['SEHAB'],
    status: 'Em andamento',
    detalhes: {
      grupo_tematico: 'Obra nova',
      tipo_obra: 'Unidade habitacional',
      equipamento: 'Provisão habitacional',
      subprefeitura: 'Itaquera',
    },
  },
  {
    endereco: 'AVENIDA FERNANDO ESPÍRITO SANTO ALVES DE MATTOS, 1000',
    programa: 'Monitoramento de Obras 2021/2024 - SEHAB',
    projeto: 'Copa do povo - Gleba B',
    responsavel: ['SEHAB'],
    status: 'Em andamento',
    detalhes: {
      grupo_tematico: 'Obra nova',
      tipo_obra: 'Unidade habitacional',
      equipamento: 'Provisão habitacional',
      subprefeitura: 'Itaquera',
    },
  },
  {
    endereco: 'AVENIDA FERNANDO ESPÍRITO SANTO ALVES DE MATTOS, 1000',
    programa: 'Orçamento Cidadão 2023 (LOA 2024)',
    projeto: 'Construção do Céu Jardim Brasil',
    responsavel: ['SME'],
    status: 'Selecionado',
    detalhes: null,
  },
  {
    endereco: 'AVENIDA FERNANDO ESPÍRITO SANTO ALVES DE MATTOS, 1000',
    programa: 'Portfólio Primeira Infância',
    projeto: 'Balanço PMPI 2023',
    responsavel: ['SEPLAN'],
    status: 'Registrado',
    detalhes: null,
  },
  {
    endereco: 'AVENIDA FERNANDO ESPÍRITO SANTO ALVES DE MATTOS, 1000',
    programa: 'Programa de Metas 2021 - 2024 Versão Alteração Programática',
    projeto: '01 - Atender 1.900.000 pessoas em programas de transferência de renda e/ou apoio nutricional',
    responsavel: ['SME', 'GCM', 'SEHAB', 'SEPLAN'],
    status: null,
    detalhes: {
      projetos: '1.1 - Banco de Alimentos (SMDHC)',
      projeto2: 'Projeto 1.1',
    },
  },
  {
    endereco: 'AVENIDA FERNANDO ESPÍRITO SANTO ALVES DE MATTOS, 1000',
    programa: 'Plano de Ação para Implementação da Agenda Municipal 2030 2021-2024',
    projeto: '01.01-A - Fortalecer atuação intersetorial da Prefeitura de cidade de São Paulo visando o aprimoramento das políticas públicas numa perspectiva de olhar integral à(ao) cidadã(o) e divulgar os programas e ações existentes.',
    responsavel: ['SME', 'SEPLAN'],
    status: null,
    detalhes: null,
  },
  {
    endereco: 'AVENIDA FERNANDO ESPÍRITO SANTO ALVES DE MATTOS, 1000',
    programa: 'Plano Municipal de Agroecologia e Desenvolvimento Rural Sustentável - Plano Rural',
    projeto: '02.05.01 A - Ampliar em até 20% o investimento dos indígenas com a agricultura',
    responsavel: ['SME', 'GCM', 'SEPLAN'],
    status: null,
    detalhes: null,
  },
];

const geolocalizadorStore = useGeolocalizadorStore();

function buscarProximidade(endereco: PontoEndereco) {
  console.log(endereco);

  const [camada] = endereco.camadas;
  const [lat, lon] = endereco.endereco.geometry.coordinates;

  geolocalizadorStore.buscaProximidades({
    geo_camada_codigo: camada.codigo,
    lat,
    lon,
  });
}
</script>

<template>
  <!-- <Dashboard> -->

  <div class="flex spacebetween center mb2 mt2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <div class="flex g2 ml1">
      <button class="btn big outline bgnone tamarelo">
        Pesquisar por endereço
      </button>

      <button class="btn big outline bgnone tcprimary">
        Pesquisar por dotação
      </button>
    </div>
  </div>

  <BuscadorGeolocalizacao @selecao="buscarProximidade" />

  <article
    class="tabela-resultados"
  >
    <SmaeTable
      :colunas="[
        // { chave: 'legenda', atributosDaColuna: { class: 'col--minimum' } },
        { chave: 'endereco', label: 'Endereço / distância (km)', ehCabecalho: true },
        { chave: 'programa', label: 'portfólio/plano ou programa' },
        { chave: 'projeto', label: 'nome/meta' },
        { chave: 'responsavel', label: 'orgão' },
        { chave: 'status', label: 'status', formatador: v => v || 'N/A' },
        { chave: 'detalhes', label: 'detalhes' },
      ]"
      :dados="dados"
    >
      <template #cabecalho:legenda />
      <template #celula:endereco="{ celula }">
        <div class="celula__item">
          {{ celula }}
        </div>
      </template>

      <template #celula:responsavel="{ celula }">
        <div class="celula__lista">
          <div
            v-for="orgao in celula"
            :key="`orgao--${orgao}`"
            class="celula__item"
          >
            {{ orgao }}
          </div>
        </div>
      </template>

      <template #celula:detalhes="{ celula }">
        <div class="celula__lista">
          <div
            v-for="(detalhe, detalheKey) in celula"
            :key="`detalhe--${detalheKey}`"
            class="celula__item"
          >
            {{ detalheKey }}: {{ detalhe }}
          </div>
        </div>
      </template>
    </SmaeTable>
  </article>
</template>

<style lang="less" scoped>
.tabela-resultados {
  :deep {
    .table-cell {
      vertical-align: baseline;
      max-width: 200px;
    }
  }
}

.legenda-item {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 100%;
  background-color: #3B5881;
}

.celula__lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.celula__item {
  position: relative;
  display: flex;
  margin-left: 10pxx;
  line-height: 20px;

  &::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 7px;

    width: 5px;
    height: 5px;
    border-radius: 100%;
    background-color: #3B5881;
  }
}

</style>
