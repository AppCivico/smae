<script lang="ts" setup>
import * as CardEnvelope from '@/components/cardEnvelope';
import Dashboard from '@/components/DashboardLayout.vue';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import FiltroDeProjetos from '@/components/painelEstrategico/FiltroDeProjetos.vue';
import GrandesNumeros from '@/components/painelEstrategico/GrandesNumeros.vue';
import ProjetosPorEtapa from '@/components/painelEstrategico/ProjetosPorEtapa.vue';
import ProjetosPorOrgaoResponsavel from '@/components/painelEstrategico/ProjetosPorOrgaoResponsavel.vue';
import ProjetosPorStatus from '@/components/painelEstrategico/ProjetosPorStatus.vue';
import ResumoOrcamentario from '@/components/painelEstrategico/ResumoOrcamentario.vue';
import ExecucaoOrcamentaria from '@/components/painelEstrategico/ExecucaoOrcamentaria.vue';
import TabelaProjetos from '@/components/painelEstrategico/TabelaProjetos.vue';
import TotalDeProjetos from '@/components/painelEstrategico/TotalDeProjetos.vue';
import ProjetosPlanejadosMes from '@/components/painelEstrategico/ProjetosPlanejadosMes.vue';
import ProjetosConcluidosMes from '@/components/painelEstrategico/ProjetosConcluidosMes.vue';
import HorizontalSideBySideBarsChart from '@/components/HorizontalSideBySideBarsChart.vue';
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
  paginacaoProjetos,
} = storeToRefs(painelEstrategicoStore);

watchEffect(() => {
  const parametrosValidos = [
    'portfolio_id',
    'orgao_responsavel_id',
    'projeto_id',
  ];

  const parametros = parametrosValidos.reduce((acc, parametro) => {
    if (
      route.query[parametro]
      && (!Array.isArray(route.query[parametro]) || route.query[parametro].length)
    ) {
      acc[parametro] = route.query[parametro];
    }

    return acc;
  }, {} as Record<string, unknown>);

  painelEstrategicoStore.buscarDados(parametros);
  painelEstrategicoStore.buscarProjetosParaMapa(parametros);
});

watchEffect(() => {
  painelEstrategicoStore.buscarProjetos({
    token_paginacao: route.query.token_paginacao,
    pagina: route.query.pagina,
    portfolio_id: route.query.portfolio_id,
    orgao_responsavel_id: route.query.orgao_responsavel_id,
    projeto_id: route.query.projeto_id,
    ipp: 10,
  });
});


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
      <CardEnvelope.Conteudo>
        <CardEnvelope.Titulo
          titulo="Grandes números"
          icone="gear"
          subtitulo="Total de projetos relacionados as metas e órgãos."
        />

        <GrandesNumeros :grandes-numeros="painelEstrategicoStore.grandesNumeros" />
      </CardEnvelope.conteudo>

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
          :ano="painelEstrategicoStore.quantidadesProjeto?.ano"
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
            icone="box"
            subtitulo="Total de projetos relacionados as metas e órgãos."
          />
          <ProjetosPorEtapa
            :projetos-por-etapas="painelEstrategicoStore.projetoEtapas"
          />
        </CardEnvelope.conteudo>
        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Projetos por status"
            icone="box"
            subtitulo="Total de projetos relacionados as metas e órgãos."
          />
          <ProjetosPorStatus
            :projetos-por-status="painelEstrategicoStore.projetoStatus"
          />
        </CardEnvelope.conteudo>
      </CardEnvelope.default>

      <CardEnvelope.Conteudo class="cartao--mapa">
        <CardEnvelope.Titulo
          titulo="Mapa"
          subtitulo="Localização dos projetos conforme filtro aplicado."
          icone="map"
        />

        <MapaExibir
          :geo-json="locaisAgrupados.enderecos"
          :camadas="locaisAgrupados.camadas"
          class="mb1"
          agrupar-marcadores
          :opções-do-polígono="{
            fill: true,
            opacity: 0.5,
          }"
          zoom="16"
        />
      </CardEnvelope.conteudo>

      <CardEnvelope.default>


        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
              titulo="Projetos Planejados"
              icone="box"
              cor="#A77E11"
              subtitulo="Volume de projetos planejados no ano vigente e nos anos futuros."
          />
          <HorizontalSideBySideBarsChart
            :projetos-planejados-ano="painelEstrategicoStore.projetosPlanejadosAno"
            :projetos-concluidos-ano="painelEstrategicoStore.projetosConcluidosAno"
          />
          <div style="margin-top: 25px;">
            <hr>
            <p style=" color: #A2A6AB; max-width: 25em; margin-top: 0.5rem; font-size: 10px; line-height: 1.4;">
              Volume de projetos planejados por Ano/Mês.
            </p>
          </div>
          
          <ProjetosPlanejadosMes
            :projetos-planejados-mes="painelEstrategicoStore.projetosPlanejadosMes"
            :projetos-concluidos-mes="painelEstrategicoStore.projetosConcluidosMes"
            :anos-mapa-calor-planejados="painelEstrategicoStore.anosMapaCalorPlanejados"
          />
        </CardEnvelope.conteudo>

        <CardEnvelope.Conteudo>
            <CardEnvelope.Titulo
              titulo="Projetos Concluídos"
              icone="box"
              cor="#D3A730"
              subtitulo="Volume de projetos concluídos no ano vigente e nos anos anteriores."
          />
          <!--<HorizontalSideBySideBarsChart
            :projetos-planejados-ano="painelEstrategicoStore.projetosPlanejadosAno"
            :projetos-concluidos-ano="painelEstrategicoStore.projetosConcluidosAno"
          />
          <div style="margin-top: 25px;">
            <hr>
            <p style=" color: #A2A6AB; max-width: 25em; margin-top: 0.5rem; font-size: 10px; line-height: 1.4;">
              Volume de projetos planejados por Ano/Mês.
            </p>
          </div>-->

          <ProjetosConcluidosMes
          :projetos-planejados-mes="painelEstrategicoStore.projetosPlanejadosMes"
          :projetos-concluidos-mes="painelEstrategicoStore.projetosConcluidosMes"
          :anos-mapa-calor-concluidos="painelEstrategicoStore.anosMapaCalorConcluidos"
          />
        </CardEnvelope.conteudo>


      <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Projetos por órgão responsável"
            subtitulo="Órgãos com os números mais expressivos de projetos. Demais órgãos apresentados em Outros."
          />
          <ProjetosPorOrgaoResponsavel
            :projetos-orgao-responsavel="painelEstrategicoStore.projetoOrgaoResponsavel"
          />
        </CardEnvelope.conteudo>
 

      </CardEnvelope.default>
    </div>

    <ErrorComponent v-if="erros.projetosPaginados" />

    <LoadingComponent v-if="chamadasPendentes.projetosPaginados" />

    <div
      v-else
      class="mt2"
    >
      <CardEnvelope.Conteudo>
        <CardEnvelope.Titulo
          titulo="Execução Orçamentária"
          subtitulo="Gráfico de análise orçamentária anual e planilha orçamentária detalhada por projeto."
          icone="moneyChart"
          cor="#D86B2C"
        />
        <ExecucaoOrcamentaria />
      </CardEnvelope.Conteudo>

      <CardEnvelope.Conteudo class="mt2">
        <CardEnvelope.Titulo>
          Projetos
        </CardEnvelope.Titulo>
        <TabelaProjetos
          class="grid-full-column"
          :projetos="painelEstrategicoStore?.projetosPaginados"
          :paginacao="paginacaoProjetos"
        />
      </CardEnvelope.Conteudo>
    </div>
    <TotalDeProjetos />
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
  display: flex;
  flex-direction: column;

  .mapa {
    flex-grow: 1;
  }

  @media screen and (min-width: @duas-colunas) {
    grid-column: span 2;
    grid-row: span 2;
  }
}
</style>
