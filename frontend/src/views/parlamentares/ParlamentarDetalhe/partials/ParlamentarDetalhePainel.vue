<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ErrorComponent from '@/components/ErrorComponent.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import dinheiro from '@/helpers/dinheiro';
import { usePainelParlamentarStore } from '@/stores/painelParlamentar.store';

import BarraDePercentual from '../components/BarraDePercentual.vue';
import CartaoDeTransferencia from '../components/CartaoDeTransferencia.vue';
import FiltroDePeriodo from '../components/FiltroDePeriodo.vue';
import GraficoPorPartido from '../components/GraficoPorPartido.vue';
import GraficoPorSecretaria from '../components/GraficoPorSecretaria.vue';
import PainelCartao from '../components/PainelCartao.vue';

const props = defineProps<{
  parlamentarId: number;
}>();

const route = useRoute();
const router = useRouter();

const painelParlamentarStore = usePainelParlamentarStore();
const {
  painel, transferencias, paginacao, chamadasPendentes, erros,
} = storeToRefs(painelParlamentarStore);

const numeroOuIndefinido = (valor: unknown) => (valor ? Number(valor) : undefined);

const periodo = computed(() => {
  const inicio = numeroOuIndefinido(route.query.ano_inicio);
  const fim = numeroOuIndefinido(route.query.ano_fim);

  return inicio && fim && inicio > fim
    ? { ano_inicio: fim, ano_fim: inicio }
    : { ano_inicio: inicio, ano_fim: fim };
});

const ordenacao = computed(() => ({
  ordem_orgao_id: numeroOuIndefinido(route.query.ordem_orgao_id),
  ordem_valor: (route.query.ordem_valor as 'asc' | 'desc' | undefined) || undefined,
}));

const ordemOrgaoId = ref(route.query.ordem_orgao_id || '');
const ordemValor = ref(route.query.ordem_valor || 'desc');

const secretarias = computed(() => (painel.value?.por_secretaria || [])
  .flatMap((item) => (!item.outros && item.orgao ? [item.orgao] : [])));

const rodapeDaParticipacao = 'Percentual do total disponibilizado pelo parlamentar em relação ao '
  + 'total disponibilizado para o município nas transferências em andamento';

function navegarPara(novosParametros: Record<string, unknown>) {
  router.push({
    name: route.name,
    params: route.params,
    query: {
      ...route.query,
      ...novosParametros,
      pagina: undefined,
      token_paginacao: undefined,
    },
  });
}

function filtrar(novoPeriodo: { ano_inicio?: number; ano_fim?: number }) {
  navegarPara(novoPeriodo);
}

function ordenar() {
  navegarPara({
    ordem_orgao_id: ordemOrgaoId.value || undefined,
    ordem_valor: ordemValor.value || undefined,
  });
}

watch(
  [() => props.parlamentarId, periodo],
  () => {
    painelParlamentarStore.buscarPainel(props.parlamentarId, periodo.value);
  },
  { immediate: true },
);

watch(
  [
    () => props.parlamentarId,
    periodo,
    ordenacao,
    () => route.query.pagina,
    () => route.query.token_paginacao,
  ],
  () => {
    painelParlamentarStore.buscarTransferencias(props.parlamentarId, {
      ...periodo.value,
      ...ordenacao.value,
      pagina: numeroOuIndefinido(route.query.pagina),
      token_paginacao: (route.query.token_paginacao as string) || undefined,
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class="painel-do-parlamentar">
    <FiltroDePeriodo
      class="painel-do-parlamentar__filtro"
      :ano-inicio="periodo.ano_inicio"
      :ano-fim="periodo.ano_fim"
      @filtrar="filtrar"
    />

    <LoadingComponent v-if="chamadasPendentes.painel && !painel" />

    <ErrorComponent
      v-else-if="erros.painel"
      :erro="erros.painel"
    />

    <div
      v-else-if="painel"
      class="painel-do-parlamentar__grade"
      :aria-busy="chamadasPendentes.painel"
    >
      <PainelCartao
        class="painel-do-parlamentar__transferencias"
        titulo="Transferências"
        rodape="Transferências em andamento/total"
      >
        <p class="painel-do-parlamentar__contagem">
          <strong class="painel-do-parlamentar__em-andamento">
            {{ painel.transferencias.em_andamento }}</strong><span
            class="painel-do-parlamentar__total"
          >/{{ painel.transferencias.total }}</span>
        </p>
      </PainelCartao>

      <PainelCartao
        class="painel-do-parlamentar__recurso"
        titulo="Recurso Disponibilizado e Utilizado"
        rodape="Total de recursos disponibilizados, e percentual utilizado, em reais"
      >
        <p class="painel-do-parlamentar__disponibilizado">
          <span class="painel-do-parlamentar__disponibilizado-rotulo">Valor Disponibilizado:</span>
          {{ dinheiro(painel.recurso.valor_disponibilizado, { style: 'currency' }) }}
        </p>

        <BarraDePercentual
          class="painel-do-parlamentar__barra"
          :percentual="painel.recurso.pct_utilizado"
          :rotulo="dinheiro(painel.recurso.valor_utilizado, { style: 'currency' })"
        />
      </PainelCartao>

      <div class="painel-do-parlamentar__coluna">
        <PainelCartao
          class="painel-do-parlamentar__participacao"
          titulo="Participação no Município"
          :rodape="rodapeDaParticipacao"
        >
          <BarraDePercentual
            class="painel-do-parlamentar__barra"
            :percentual="painel.participacao_municipio.pct"
          />
        </PainelCartao>

        <PainelCartao
          class="painel-do-parlamentar__partido"
          titulo="Participação por partido"
          rodape="Total de recursos disponibilizados pelo parlamentar, referente a seu partido"
        >
          <GraficoPorPartido
            v-if="painel.por_partido.length"
            :itens="painel.por_partido"
          />
          <p
            v-else
            class="painel-do-parlamentar__vazio"
          >
            Nenhum recurso disponibilizado no período.
          </p>
        </PainelCartao>
      </div>

      <PainelCartao
        class="painel-do-parlamentar__secretaria"
        titulo="Total por Secretaria"
        rodape="Total de recursos disponibilizados, pelo parlamentar para cada secretaria"
      >
        <GraficoPorSecretaria
          v-if="painel.por_secretaria.length"
          :itens="painel.por_secretaria"
        />
        <p
          v-else
          class="painel-do-parlamentar__vazio"
        >
          Nenhum recurso distribuído no período.
        </p>
      </PainelCartao>
    </div>

    <section class="painel-do-parlamentar__lista">
      <header class="painel-do-parlamentar__cabecalho-da-lista">
        <h3 class="painel-do-parlamentar__titulo-da-lista">
          Transferências
        </h3>

        <hr class="painel-do-parlamentar__linha">

        <form
          class="painel-do-parlamentar__ordenacao"
          @submit.prevent="ordenar"
        >
          <span class="painel-do-parlamentar__ordenar-por">Ordenar por</span>

          <label class="painel-do-parlamentar__campo painel-do-parlamentar__campo--pequeno">
            <span class="painel-do-parlamentar__rotulo painel-do-parlamentar__rotulo--pequeno">
              Secretaria
            </span>
            <select
              v-model="ordemOrgaoId"
              name="ordem_orgao_id"
              class="painel-do-parlamentar__seletor painel-do-parlamentar__seletor--pequeno"
            >
              <option value="">
                Todas
              </option>

              <option
                v-for="orgao in secretarias"
                :key="orgao.id"
                :value="String(orgao.id)"
                :title="orgao.descricao"
              >
                {{ orgao.sigla }}
              </option>
            </select>
          </label>

          <label class="painel-do-parlamentar__campo painel-do-parlamentar__campo--pequeno">
            <span class="painel-do-parlamentar__rotulo painel-do-parlamentar__rotulo--pequeno">
              Valor
            </span>

            <select
              v-model="ordemValor"
              name="ordem_valor"
              class="painel-do-parlamentar__seletor painel-do-parlamentar__seletor--pequeno"
            >
              <option value="desc">
                decrescente
              </option>
              <option value="asc">
                crescente
              </option>
            </select>
          </label>

          <button
            type="button"
            class="btn small painel-do-parlamentar__botao painel-do-parlamentar__botao--pequeno"
            data-test="ordenar"
            @click="ordenar"
          >
            Ordenar
          </button>
        </form>
      </header>

      <ErrorComponent
        v-if="erros.transferencias"
        :erro="erros.transferencias"
      />

      <div
        v-else
        class="painel-do-parlamentar__transferencias-lista"
        :aria-busy="chamadasPendentes.transferencias"
      >
        <CartaoDeTransferencia
          v-for="transferencia in transferencias"
          :key="transferencia.id"
          :transferencia="transferencia"
        />

        <p
          v-if="!transferencias.length && !chamadasPendentes.transferencias"
          class="painel-do-parlamentar__vazio"
        >
          Nenhuma transferência encontrada.
        </p>
      </div>

      <MenuPaginacao
        class="painel-do-parlamentar__paginacao"
        :paginas="paginacao.paginas"
        :tem-mais="paginacao.temMais"
        :token-paginacao="paginacao.tokenPaginacao || ''"
      />
    </section>
  </div>
</template>

<style scoped lang="less">
.painel-do-parlamentar__filtro {
  margin-bottom: 48px;
}

.painel-do-parlamentar__campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 186px;
}

.painel-do-parlamentar__campo--pequeno {
  gap: 7px;
  width: 157px;
}

.painel-do-parlamentar__rotulo {
  font-size: 12px;
  font-weight: 700;
  line-height: 24px;
  text-transform: uppercase;
  color: @c600;
}

.painel-do-parlamentar__rotulo--pequeno {
  font-size: 10.5px;
  line-height: 21px;
}

.painel-do-parlamentar__seletor {
  height: 44px;
  padding: 10px 16px;
  border: 1.5px solid @c100;
  border-radius: 4px;
  background-color: @branco;
  font-size: 14px;
  line-height: 1.4;
  color: @c400;
}

.painel-do-parlamentar__seletor--pequeno {
  height: 38.5px;
  padding: 8.75px 14px;
  border-width: 1.3px;
  border-radius: 3.5px;
  font-size: 12.24px;
}

.painel-do-parlamentar__ordenar-por {
  font-size: 12px;
  font-weight: 900;
  line-height: 21px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: @c600;
}

.painel-do-parlamentar__ordenar-por {
  padding-bottom: 8px;
  color: #233b5c;
}

.painel-do-parlamentar__botao {
  height: 40px;
  margin-bottom: 2px;
}

.painel-do-parlamentar__botao--pequeno {
  height: 32px;
  margin-bottom: 3px;
}

.painel-do-parlamentar__grade {
  display: grid;
  grid-template-columns: 506fr 558fr;
  grid-template-areas:
    'transferencias recurso'
    'coluna secretaria';
  gap: 48px 46px;
  margin-bottom: 74px;
}

.painel-do-parlamentar__transferencias {
  grid-area: transferencias;
  min-height: 196px;
}

.painel-do-parlamentar__recurso {
  grid-area: recurso;
  min-height: 196px;
}

.painel-do-parlamentar__coluna {
  grid-area: coluna;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.painel-do-parlamentar__participacao {
  min-height: 181px;
}

.painel-do-parlamentar__partido {
  min-height: 355px;
}

.painel-do-parlamentar__secretaria {
  grid-area: secretaria;
  min-height: 562px;
}

.painel-do-parlamentar__contagem {
  margin: 0;
  padding: 8px 0 4px;
  font-family: 'Roboto Slab', serif;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
}

.painel-do-parlamentar__em-andamento {
  font-size: 80px;
  color: @c500;
}

.painel-do-parlamentar__total {
  margin-left: 6px;
  font-size: 58px;
  color: @c400;
}

.painel-do-parlamentar__disponibilizado {
  margin: 14px 0 15px 4px;
  font-size: 14px;
  line-height: 1;
  color: @cinza-medio;
}

.painel-do-parlamentar__disponibilizado-rotulo {
  font-size: 12px;
  font-weight: 300;
  color: #333;
}

.painel-do-parlamentar__barra {
  margin: 0 0 32px 4px;
}

.painel-do-parlamentar__participacao .painel-do-parlamentar__barra {
  margin: 30px 0 20px;
}

.painel-do-parlamentar__vazio {
  margin: 24px 0;
  text-align: center;
  color: @c400;
}

.painel-do-parlamentar__cabecalho-da-lista {
  display: flex;
  align-items: center;
  gap: 18px;
}

.painel-do-parlamentar__titulo-da-lista {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 26px;
  white-space: nowrap;
  color: @primary;
}

.painel-do-parlamentar__linha {
  flex-grow: 1;
  margin: 0;
  border: 0;
  border-top: 0.94px solid @c500;
}

.painel-do-parlamentar__ordenacao {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding-bottom: 30px;
}

.painel-do-parlamentar__transferencias-lista {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.painel-do-parlamentar__paginacao {
  margin-top: 72px;
}
</style>
