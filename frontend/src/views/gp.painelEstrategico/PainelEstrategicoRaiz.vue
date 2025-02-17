<script lang="ts" setup>
import * as CardEnvelope from '@/components/cardEnvelope';
import Dashboard from '@/components/DashboardLayout.vue';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import ExecucaoOrcamentaria from '@/components/painelEstrategico/ExecucaoOrcamentaria.vue';
import ExecucaoOrcamentariaGrafico from '@/components/painelEstrategico/ExecucaoOrcamentariaGrafico.vue';
import FiltroDeProjetos from '@/components/painelEstrategico/FiltroDeProjetos.vue';
import GrandesNumeros from '@/components/painelEstrategico/GrandesNumeros.vue';
import ProjetosConcluidosAnoBarra from '@/components/painelEstrategico/ProjetosConcluidosAnoBarra.vue';
import ProjetosConcluidosMes from '@/components/painelEstrategico/ProjetosConcluidosMes.vue';
import ProjetosPlanejadosAnoBarra from '@/components/painelEstrategico/ProjetosPlanejadosAnoBarra.vue';
import ProjetosPlanejadosMes from '@/components/painelEstrategico/ProjetosPlanejadosMes.vue';
import ProjetosPorEtapa from '@/components/painelEstrategico/ProjetosPorEtapa.vue';
import ProjetosPorOrgaoResponsavel from '@/components/painelEstrategico/ProjetosPorOrgaoResponsavel.vue';
import ProjetosPorStatus from '@/components/painelEstrategico/ProjetosPorStatus.vue';
import ResumoOrcamentario from '@/components/painelEstrategico/ResumoOrcamentario.vue';
import TabelaProjetos from '@/components/painelEstrategico/TabelaProjetos.vue';
import TotalDeProjetos from '@/components/painelEstrategico/TotalDeProjetos.vue';
import projectStatuses from '@/consts/projectStatuses';
import gerarCoresIntermediarias from '@/helpers/cores/gerarCoresIntermediarias';
import { useAlertStore } from '@/stores/alert.store';
import { usePainelEstrategicoStore } from '@/stores/painelEstrategico.store';
import { useRegionsStore } from '@/stores/regions.store';
import type { GeoLocCamadaFullDto } from '@back/geo-loc/entities/geo-loc.entity.ts';
import { isEqual } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

type Camada = GeoLocCamadaFullDto & {
  id: number
  config: Record<string, unknown>
  totalDeProjetos: number
};

type Endereco = {
  properties: Record<string, unknown>
};

const regiaoPadrao = 180;
const nivelRegionalizacaoPadrao = 3;

const strokeColor = '#660000';
const opacidadePreenchimento = 0.35;
const espessuraDoFio = 3;

const corParaMaximo = '#511515';
const corParaMinimo = '#ffd29e';
const route = useRoute();
const router = useRouter();

const painelEstrategicoStore = usePainelEstrategicoStore(route.meta.entidadeMãe as string);

const regionsStore = useRegionsStore();

const { camadas } = storeToRefs(regionsStore);

const alertStore = useAlertStore();

const {
  chamadasPendentes,
  erros,
  paginacaoProjetos,
  paginacaoOrcamentos,
  projetosParaMapa,
} = storeToRefs(painelEstrategicoStore);

const camadasDaCidade = ref<number[]>([]);

const locaisAgrupados = computed(() => {
  const totalDeProjetos: Record<number, number> = {};
  const enderecos: Endereco[] = [];

  let i = 0;
  let maximoDeProjetos = 0;

  while (projetosParaMapa.value[i as keyof unknown]) {
    const projeto = projetosParaMapa.value[i as keyof unknown];
    if (projeto.geolocalizacao_sumario) {
      let subPrefeitura = '';
      if (projeto.geolocalizacao_sumario.camadas) {
        for (let k = 0; k < projeto.geolocalizacao_sumario.camadas.length; k += 1) {
          const camadaId = projeto.geolocalizacao_sumario.camadas[k];
          const camada = camadas.value?.[camadaId] as unknown as GeoLocCamadaFullDto;

          if (nivelRegionalizacaoPadrao === camada?.nivel_regionalizacao) {
            if (totalDeProjetos[camadaId]) {
              totalDeProjetos[camadaId] += 1;
            } else {
              totalDeProjetos[camadaId] = 1;
            }

            subPrefeitura = camada?.regiao?.reduce((acc, cur) => `${acc + cur.descricao}, `, '')?.slice(0, -2)
              || camada?.titulo
              || '';

            maximoDeProjetos = Math.max(
              maximoDeProjetos,
              totalDeProjetos[camadaId],
            );
          }
        }
      }

      if (projeto.geolocalizacao_sumario.endereco_geom_geojson) {
        enderecos.push(projeto.geolocalizacao_sumario.endereco_geom_geojson);

        enderecos[enderecos.length - 1].properties.projeto_nome = projeto.projeto_nome;
        enderecos[enderecos.length - 1].properties.projeto_status = projeto.projeto_status;
        enderecos[enderecos.length - 1].properties.projeto_etapa = projeto.projeto_etapa;
        enderecos[enderecos.length - 1].properties.orgao_resp_sigla = projeto.orgao_resp_sigla;
        enderecos[enderecos.length - 1].properties.subPrefeitura = subPrefeitura;
      }
    }
    i += 1;
  }

  const cores = [
    corParaMinimo,
    ...gerarCoresIntermediarias(corParaMinimo, corParaMaximo, maximoDeProjetos - 1, { format: 'hsl', huePath: 'short' }),
    corParaMaximo,
  ];
  return {
    camadas: (camadasDaCidade.value.map((id) => ({ id })) as Camada[])
      .map((camada) => {
        if (!camada.config) {
          camada.config = {
            className: 'camada',
            color: strokeColor,
            weight: espessuraDoFio,
            fillOpacity: opacidadePreenchimento,
          };
        }

        camada.config.fillColor = totalDeProjetos[camada.id]
          ? cores[totalDeProjetos[camada.id]]
          : cores[0];

        return camada;
      }),
    enderecos,
  };
});

const limparPaginacao = () => {
  paginacaoProjetos.value.validoAte = 0;
  paginacaoOrcamentos.value.validoAte = 0;

  return router.replace({
    query: {
      ...route.query,
      projetos_token_paginacao: undefined,
      projetos_pagina: undefined,
      orcamentos_token_paginacao: undefined,
      orcamentos_pagina: undefined,
    },
  });
};

function buscarProjetos() {
  const projetosTokenPaginacaoNovo = route.query.projetos_token_paginacao;
  const projetosPaginaNovo = route.query.projetos_pagina;

  if (Number(projetosPaginaNovo) > 1) {
    if (
      paginacaoProjetos.value.validoAte
      && paginacaoProjetos.value.validoAte <= Date.now()
    ) {
      alertStore.error('Resultados obsoletos. Buscando novamente e retornando à primeira página');
      limparPaginacao();
    }
  } else {
    router.replace({
      query: {
        ...route.query,
        projetos_token_paginacao: undefined,
      },
    });
  }

  painelEstrategicoStore.buscarProjetos({
    token_paginacao: projetosTokenPaginacaoNovo,
    pagina: projetosPaginaNovo,
    portfolio_id: route.query.portfolio_id,
    orgao_responsavel_id: route.query.orgao_responsavel_id,
    projeto_id: route.query.projeto_id,
    ipp: 10,
  });
}

function buscarOrcamentos() {
  const orcamentosTokenPaginacaoNovo = route.query.orcamentos_token_paginacao;
  const orcamentosPaginaNovo = route.query.orcamentos_pagina;

  if (Number(orcamentosPaginaNovo) > 1) {
    if (
      paginacaoOrcamentos.value.validoAte
      && paginacaoOrcamentos.value.validoAte <= Date.now()
    ) {
      alertStore.error('Resultados obsoletos. Buscando novamente e retornando à primeira página');
      limparPaginacao();
    }
  } else {
    router.replace({
      query: {
        ...route.query,
        orcamentos_token_paginacao: undefined,
      },
    });
  }

  painelEstrategicoStore.buscarOrcamentos({
    token_paginacao: orcamentosTokenPaginacaoNovo,
    pagina: orcamentosPaginaNovo,
    portfolio_id: route.query.portfolio_id,
    orgao_responsavel_id: route.query.orgao_responsavel_id,
    projeto_id: route.query.projeto_id,
    ipp: 15,
  });
}

async function iniciar() {
  const parametros = {
    portfolio_id: route.query.portfolio_id,
    orgao_responsavel_id: route.query.orgao_responsavel_id,
    projeto_id: route.query.projeto_id,
  };

  painelEstrategicoStore.buscarDados(parametros);

  if (!camadasDaCidade.value.length) {
    camadasDaCidade.value = await regionsStore.buscarCamadas({
      filha_de_regiao_id: regiaoPadrao,
      regiao_nivel_regionalizacao: nivelRegionalizacaoPadrao,
      retornar_regioes: true,
    });
  }

  painelEstrategicoStore.buscarProjetosParaMapa(parametros, camadasDaCidade.value);
  buscarProjetos();
  buscarOrcamentos();
}

iniciar();

watch(
  [
    () => route.query.portfolio_id,
    () => route.query.orgao_responsavel_id,
    () => route.query.projeto_id,
  ],
  async ([
    portfolioIdNovo,
    orgaoResponsavelIdNovo,
    projetoIdNovo,
  ], [
    portfolioIdAnterior,
    orgaoResponsavelIdAnterior,
    projetoIdAnterior,
  ]) => {
    switch (true) {
      // comparando evitar chamadas desnecessárias quando os valores são apenas
      // reavaliados
      case !isEqual(portfolioIdNovo, portfolioIdAnterior):
      case !isEqual(orgaoResponsavelIdNovo, orgaoResponsavelIdAnterior):
      case !isEqual(projetoIdNovo, projetoIdAnterior):
        await limparPaginacao();
        iniciar();
        break;
      default:
        break;
    }
  },
);

watch(
  [
    () => route.query.projetos_token_paginacao,
    () => route.query.projetos_pagina,
  ],
  buscarProjetos,
);

watch(
  [
    () => route.query.orcamentos_token_paginacao,
    () => route.query.orcamentos_pagina,
  ],
  buscarOrcamentos,
);
</script>
<template>
  <Dashboard>
    <header class="mb2 cabecalho">
      <TítuloDePágina />
    </header>

    <FormularioQueryString v-slot="{ aplicarQueryStrings, detectarMudancas, formularioSujo }">
      <FiltroDeProjetos
        :class="{
          'formulario-sujo': formularioSujo
        }"
        @enviado="aplicarQueryStrings"
        @campo-mudou="detectarMudancas"
      />
    </FormularioQueryString>

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
          subtitulo="Total de projetos relacionados às metas e órgãos."
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

      <CardEnvelope.Slide>
        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Projetos por status"
            icone="box"
          />
          <ProjetosPorStatus
            :projetos-por-status="painelEstrategicoStore.projetoStatus"
          />
        </CardEnvelope.Conteudo>
        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Projetos por etapas"
            icone="box"
          />
          <ProjetosPorEtapa
            :projetos-por-etapas="painelEstrategicoStore.projetoEtapas"
          />
        </CardEnvelope.Conteudo>
      </CardEnvelope.Slide>

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
          :opções-do-polígono="{
            fill: true,
            opacity: 0.5,
          }"
          zoom="16"
        >
          <template #painel-flutuante="dados">
            <p
              v-if="dados.projeto_nome"
              class="painel-flutuante__titulo"
            >
              {{ dados.projeto_nome }}
            </p>
            <p
              v-else-if="dados.titulo"
              class="painel-flutuante__titulo"
            >
              {{ dados.titulo }}
            </p>
            <p
              v-else-if="dados.rotulo"
              class="painel-flutuante__titulo"
            >
              {{ dados.rotulo }}
            </p>

            <dl
              v-if="dados.projeto_status
                || dados.projeto_orgao_responsavel
                || dados.subPrefeitura
                || dados.orgao_resp_sigla
                || dados.projeto_etapa"
              class="painel-flutuante__dados"
            >
              <div
                v-if="dados.orgao_resp_sigla"
              >
                <dt>
                  Órgão Responsável
                </dt>
                <dd>{{ dados.orgao_resp_sigla }}</dd>
              </div>
              <div
                v-if="dados.subPrefeitura"
              >
                <dt>
                  Subprefeitura
                </dt>
                <dd>{{ dados.subPrefeitura }}</dd>
              </div>
              <div
                v-if="dados.projeto_status"
                class="painel-flutuante__status"
              >
                <dt>
                  Status
                </dt>
                <dd
                  :style="{
                    '--statusColor': projectStatuses[dados.projeto_status]?.cor,
                  }"
                >
                  {{ projectStatuses[dados.projeto_status]?.nome || dados.projeto_status }}
                </dd>
              </div>
              <div
                v-if="dados.projeto_etapa"
              >
                <dt>
                  Etapa
                </dt>
                <dd>
                  {{ dados.projeto_etapa }}
                </dd>
              </div>
            </dl>
          </template>
        </MapaExibir>
      </CardEnvelope.conteudo>

      <CardEnvelope.Slide class="cartao-de-projetos">
        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Projetos Planejados"
            icone="box"
            cor="#A77E11"
            subtitulo="Volume de projetos planejados no ano vigente e nos anos futuros."
          />
          <ProjetosPlanejadosAnoBarra
            :projetos-planejados-ano="painelEstrategicoStore.projetosPlanejadosAno"
          />
          <div style="margin-top: 25px;">
            <hr>
            <p
              style="
              color: #A2A6AB;
              max-width: 25em;
              margin-top: 0.5rem;
              font-size: 10px;
              line-height: 1.4;
            "
            >
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
          <ProjetosConcluidosAnoBarra
            :projetos-concluidos-ano="painelEstrategicoStore.projetosConcluidosAno"
          />
          <div style="margin-top: 25px;">
            <hr>
            <p
              style="
                color: #A2A6AB;
                max-width: 25em;
                margin-top: 0.5rem;
                font-size: 10px;
                line-height: 1.4;
              "
            >
              Volume de projetos concluídos por Ano/Mês.
            </p>
          </div>

          <ProjetosConcluidosMes
            :projetos-planejados-mes="painelEstrategicoStore.projetosPlanejadosMes"
            :projetos-concluidos-mes="painelEstrategicoStore.projetosConcluidosMes"
            :anos-mapa-calor-concluidos="painelEstrategicoStore.anosMapaCalorConcluidos"
          />
        </CardEnvelope.conteudo>

        <CardEnvelope.Conteudo>
          <CardEnvelope.Titulo
            titulo="Projetos por órgão responsável"
            subtitulo="Órgãos com os números mais
              expressivos de projetos. Demais órgãos apresentados em Outros."
          />
          <ProjetosPorOrgaoResponsavel
            :projetos-orgao-responsavel="painelEstrategicoStore.projetoOrgaoResponsavel"
          />
        </CardEnvelope.conteudo>
      </CardEnvelope.Slide>
    </div>

    <div
      class="mt2"
    >
      <CardEnvelope.Conteudo>
        <CardEnvelope.Titulo>
          Projetos
        </CardEnvelope.Titulo>
        <TabelaProjetos
          class="grid-full-column"
          :projetos="painelEstrategicoStore?.projetosPaginados"
          :paginacao="paginacaoProjetos"
          :chamadas-pendentes="chamadasPendentes.projetosPaginados"
          :erro="erros.projetosPaginados"
        />
      </CardEnvelope.Conteudo>

      <CardEnvelope.Conteudo class="mt2">
        <CardEnvelope.Titulo
          titulo="Execução Orçamentária"
          subtitulo="Gráfico de análise orçamentária
            anual e planilha orçamentária detalhada por projeto."
          icone="moneyChart"
          cor="#D86B2C"
        />
        <ExecucaoOrcamentariaGrafico
          :execucao-orcamentaria="painelEstrategicoStore?.execucaoOrcamentariaAno"
        />
        <ExecucaoOrcamentaria
          :execucao-orcamentaria="painelEstrategicoStore?.execucaoOrcamentariaAno"
          :orcamentos="painelEstrategicoStore?.orcamentosPaginados"
          :paginacao="paginacaoOrcamentos"
          :chamadas-pendentes="chamadasPendentes.orcamentosPaginados"
          :erro="erros.orcamentosPaginados"
        />
      </CardEnvelope.Conteudo>
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
  gap: 2rem 3rem;

  @media screen and (min-width: @duas-colunas) {
    grid-template-columns: 2.5fr 1.5fr;
  }

  @media screen and (min-width: @tres-colunas) {
    grid-template-columns: 3fr 2fr 2fr;
  }
}

.formulario-sujo ~ * {
  filter: grayscale(1) blur(2px) opacity(0.35);
  pointer-events: none;
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

.cartao-de-projetos {
  @media screen and (min-width: @duas-colunas) {
    grid-column: span 2;
  }

  @media screen and (min-width: @tres-colunas) {
    grid-column: auto;
  }
}

:deep(.leaflet-layer) {
  filter: grayscale(0.8);
}

:deep(.camada) {
  mix-blend-mode: multiply;
}

.painel-flutuante__status dd {
  display: flex;
  border-radius: 8px;
  display: flex;
  align-items: stretch;

  background-color: color-mix(in srgb, var(--statusColor, @cinza-medio) 15%, transparent);

  &::before {
    color: var(--statusColor, @cinza-medio);
    margin-right: 0.25em;
    content: '';
    width: 8px;
    flex-shrink: 0;
    background-color: currentColor;
    display: block;
    border-radius: 8px;
  }
}
</style>
