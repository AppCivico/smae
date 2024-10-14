<script lang="ts" setup>
import * as CardEnvelope from '@/components/cardEnvelope';
import Dashboard from '@/components/DashboardLayout.vue';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import FiltroDeProjetos from '@/components/painelEstrategico/FiltroDeProjetos.vue';
import GrandesNumeros from '@/components/painelEstrategico/GrandesNumeros.vue';
import ProjetosPorEtapa from '@/components/painelEstrategico/ProjetosPorEtapa.vue';
import ProjetosPorStatus from '@/components/painelEstrategico/ProjetosPorStatus.vue';
import ResumoOrcamentario from '@/components/painelEstrategico/ResumoOrcamentario.vue';
import TabelaProjetos from '@/components/painelEstrategico/TabelaProjetos.vue';
import TotalDeProjetos from '@/components/painelEstrategico/TotalDeProjetos.vue';
import { usePainelEstrategicoStore } from '@/stores/painelEstrategico.store';
import { storeToRefs } from 'pinia';
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const painelEstrategicoStore = usePainelEstrategicoStore(route.meta.entidadeMãe as string);

const {
  chamadasPendentes,
  locaisAgrupados,
  erros,
} = storeToRefs(painelEstrategicoStore);

watchEffect(() => {
  const parametrosValidos = [
    'portfolio_id',
    'orgao_responsavel_id',
    'projeto_id',
  ];

  const parametros = parametrosValidos.reduce((acc, parametro) => {
    if (route.query[parametro]) {
      acc[parametro] = route.query[parametro];
    }

    return acc;
  }, {} as Record<string, unknown>);

  painelEstrategicoStore.buscarDados(parametros);
  painelEstrategicoStore.buscarProjetosParaMapa(parametros);
});

const mockProjetos = [
  {
    nome: 'OUCAE - Grupo 1 - Lote 3: CONSÓRCIO RM...',
    secretaria: 'SEPEP',
    meta: 12,
    status: 'Em acompanhamento',
    etapaAtual: 'Em contratação de Projeto',
    terminoProjetado: 'Out/2024',
    riscosEmAberto: 4,
    percentualAtraso: '05',
  },
  {
    nome: 'OUCAE - Grupo 1 - Lote 4: CONSÓRCIO LA ...',
    secretaria: 'SME',
    meta: null,
    status: '',
    etapaAtual: '',
    terminoProjetado: '',
    riscosEmAberto: 4,
    percentualAtraso: '',
  },
  {
    nome: 'Ribeirão dos Perus - Reservatórios, Canaliz...',
    secretaria: 'SEPEP - UE',
    meta: null,
    status: '',
    etapaAtual: '',
    terminoProjetado: '',
    riscosEmAberto: 4,
    percentualAtraso: '',
  },
  {
    nome: 'HIS Real Parque (Fase 3)',
    secretaria: 'SETRAM',
    meta: null,
    status: '',
    etapaAtual: '',
    terminoProjetado: '',
    riscosEmAberto: 4,
    percentualAtraso: '',
  },
];

</script>
<template>
  <Dashboard>
    <header class="mb2 cabecalho">
      <TítuloDePágina />
      <FormularioQueryString v-slot="{ aplicarQueryStrings }">
        <FiltroDeProjetos @enviado="aplicarQueryStrings" />
      </FormularioQueryString>
    </header>

    <div
      v-scrollLockDebug
      class="flex flexwrap g2"
    >
      <pre class="f1 fb15em debug">anosMapaCalorConcluidos:
{{ painelEstrategicoStore.anosMapaCalorConcluidos }}</pre>
      <pre class="f1 fb15em debug">anosMapaCalorPlanejados:
{{ painelEstrategicoStore.anosMapaCalorPlanejados }}</pre>
      <pre class="f1 fb15em debug">grandesNumeros:
{{ painelEstrategicoStore.grandesNumeros }}</pre>
      <pre class="f1 fb15em debug">projetoEtapas:
{{ painelEstrategicoStore.projetoEtapas }}</pre>
      <pre class="f1 fb15em debug">projetoOrgaoResponsavel:
{{ painelEstrategicoStore.projetoOrgaoResponsavel }}</pre>
      <pre class="f1 fb15em debug">projetoStatus:
{{ painelEstrategicoStore.projetoStatus }}</pre>
      <pre class="f1 fb15em debug">projetosConcluidosAno:
{{ painelEstrategicoStore.projetosConcluidosAno }}</pre>
      <pre class="f1 fb15em debug">projetosConcluidosMes:
{{ painelEstrategicoStore.projetosConcluidosMes }}</pre>
      <pre class="f1 fb15em debug">projetosPlanejadosAno:
{{ painelEstrategicoStore.projetosPlanejadosAno }}</pre>
      <pre class="f1 fb15em debug">projetosPlanejadosMes:
{{ painelEstrategicoStore.projetosPlanejadosMes }}</pre>
      <pre class="f1 fb15em debug">locaisAgrupados: {{ locaisAgrupados }}</pre>
    </div>

    <ErrorComponent v-if="erros.dados">
      {{ erros.dados }}
    </ErrorComponent>

    <LoadingComponent v-else-if="chamadasPendentes.dados" />

    <div
      v-else
      class="lista-de-cartoes"
    >
      <CardEnvelope.default>
        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Grandes números"
            icone="gear"
            subtitulo="Total de projetos relacionados as metas e órgãos."
          />

          <GrandesNumeros :grandes-numeros="painelEstrategicoStore.grandesNumeros" />
        </CardEnvelope.conteudo>
      </CardEnvelope.default>
      <CardEnvelope.Conteudo>
        <CardEnvelope.Titulo
          titulo="Projetos"
          subtitulo="Total de projetos planejados e concluídos no ano vigente."
          icone="box"
          cor="#F2C94C"
        />
        <TotalDeProjetos
          :planejados="painelEstrategicoStore.quantidadesProjeto?.quantidade_planejada"
          :concluidos="painelEstrategicoStore.quantidadesProjeto?.quantidade_concluida"
        />
      </CardEnvelope.Conteudo>

      <CardEnvelope.Conteudo>
        <CardEnvelope.Titulo
          titulo="Resumo Orçamentário"
          subtitulo="Acompanhamento dos valores orçamentários totais."
          icone="moneyChart"
          cor="#D86B2C"
        />
        <ResumoOrcamentario
          :planejado-total="painelEstrategicoStore.resumoOrcamentario?.custo_planejado_total"
          :empenho-total="painelEstrategicoStore.resumoOrcamentario?.valor_empenhado_total"
          :liquidado-total="painelEstrategicoStore.resumoOrcamentario?.valor_liquidado_total"
        />
      </CardEnvelope.Conteudo>

      <CardEnvelope.default>
        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Projetos por etapas"
            subtitulo="Total de projetos relacionados as metas e órgãos."
          />
          <ProjetosPorEtapa
            :projetos-por-etapas="painelEstrategicoStore.projetoEtapas"
          />
        </CardEnvelope.conteudo>
        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Projetos por status"
            subtitulo="Total de projetos relacionados as metas e órgãos."
          />
          <ProjetosPorStatus
            :projetos-por-status="painelEstrategicoStore.projetoStatus"
          />
        </CardEnvelope.conteudo>
      </CardEnvelope.default>

      <CardEnvelope.default class="cartao--mapa">
        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Mapa"
            subtitulo="Localização dos projetos conforme filtro aplicado."
            icone="map"
          />

          <MapaExibir
            :geo-json="locaisAgrupados.enderecos"
            :camadas="locaisAgrupados.camadas"
            class="mb1"
            :opções-do-polígono="{
              fill: true,
              opacity: 0.5,
            }"
            zoom="16"
          />
        </CardEnvelope.conteudo>
      </CardEnvelope.default>

      <!--
      <CardEnvelope.default>
        <CardEnvelope.Conteudo>
          <template
            #default="{ visivel }"
          >
            -Visivel: {{ visivel }}-
            <CardEnvelope.Titulo
              titulo=" Icone Prop"
              icone="graf"
              subtitulo="
                Órgãos com os números mais expressivos de projetos.
                Demais órgãos apresentados em Outros.
              "
            />

            <h1>Conteudo 1</h1>
            <h1>Conteudo 1</h1>
            <h1>Conteudo 1</h1>
          </template>
        </Cardenvelope.conteudo>

        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo>
            <strong>Icone Slot</strong>

            <template #icone>
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </template>
          </CardEnvelope.Titulo>

          <h1>Conteudo 2</h1>
          <h1>Conteudo 2</h1>
          <h1>Conteudo 2</h1>
        </CardEnvelope.Conteudo>

        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo>
            <strong>Icone Slot</strong>

            <template #icone>
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </template>
          </CardEnvelope.Titulo>

          <h1>Conteudo 3</h1>
          <h1>Conteudo 3</h1>
          <h1>Conteudo 3</h1>
        </CardEnvelope.Conteudo>
      </CardEnvelope.default>
      -->

      <TabelaProjetos
        class="grid-full-column"
        :projetos="mockProjetos"
      />
    </div>
  </Dashboard>
</template>

<style lang="less">
.pagina-de-painel-estrategico {
  background-image: url("@{u}painel-estrategico/mapa-cinza.png");
  background-size: cover;
  background-attachment: fixed;
}

.pagina-de-painel-estrategico body {
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
<style lang="less" scoped>
@duas-colunas: 55em;
@tres-colunas: 75em;

.cabecalho {
  position: relative;
  border-bottom: 2px solid @azul;

  &:after {
    content: '';
    position: absolute;
    bottom: -4px;
    right: 0;
    height: 6px;
    width: 6px;
    background-color: @azul;
    border-radius: 100%;
  }
}

.lista-de-cartoes {
  display: grid;
  gap: 2rem 4rem;

  @media screen and (min-width: @duas-colunas) {
    grid-template-columns: 2.5fr 1.5fr;
  }

  @media screen and (min-width: @tres-colunas) {
    grid-template-columns: 3fr 2fr;
    grid-template-columns: 2.5fr 1.5fr 2fr;
  }
}

.cartao--mapa {
  @media screen and (min-width: @duas-colunas) {
    grid-column: span 2;
    grid-row: span 2;
  }
}
</style>
