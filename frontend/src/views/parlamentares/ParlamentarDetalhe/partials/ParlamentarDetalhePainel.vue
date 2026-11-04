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
      ...structuredClone(route.query),
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
        rodape="Total de recursos disponibilizados e percentual utilizado"
      >
        <p class="painel-do-parlamentar__disponibilizado">
          <span class="painel-do-parlamentar__disponibilizado-rotulo">Valor Disponibilizado:</span>
          {{ dinheiro(painel.recurso.valor_disponibilizado, { style: 'currency' }) }}
        </p>

        <BarraDePercentual
          class="painel-do-parlamentar__barra"
          aria-label="Percentual utilizado do recurso disponibilizado"
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
            aria-label="Participação no município"
            :percentual="painel.participacao_municipio.pct"
          />
        </PainelCartao>

        <PainelCartao
          class="painel-do-parlamentar__partido"
          titulo="Participação por partido"
          rodape="Total de recursos disponibilizados pelo parlamentar por partido"
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
        rodape="Total de recursos disponibilizados pelo parlamentar para cada secretaria"
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

        <form
          class="painel-do-parlamentar__ordenacao"
          @submit.prevent="ordenar"
        >
          <fieldset class="painel-do-parlamentar__ordenacao-campos">
            <legend class="painel-do-parlamentar__ordenar-por">
              Ordenar por
            </legend>

            <label class="painel-do-parlamentar__campo painel-do-parlamentar__campo--pequeno">
              Secretaria
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
              Valor
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
          </fieldset>
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
  margin-bottom: 3.4rem;
}

.painel-do-parlamentar__campo {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 13.3rem;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.7rem;
  text-transform: uppercase;
  color: @c600;
}

.painel-do-parlamentar__campo--pequeno {
  gap: 0.5rem;
  width: 11.2rem;
  font-size: 0.8rem;
  line-height: 1.5rem;
}

.painel-do-parlamentar__seletor {
  height: 3.1rem;
  padding: 0.7rem 1.1rem;
  border: 0.1rem solid @c100;
  border-radius: 0.3rem;
  background-color: @branco;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.4;
  color: @c400;
}

.painel-do-parlamentar__seletor--pequeno {
  height: 2.8rem;
  padding: 0.6rem 1rem;
  border-width: 0.1rem;
  border-radius: 0.3rem;
  font-size: 0.9rem;
}

// Sem `float`, a `<legend>` fica fora do layout flex do `<fieldset>` e ocupa uma linha própria.
.painel-do-parlamentar__ordenar-por {
  float: left;
  padding: 0 0 0.6rem;
  font-size: 0.9rem;
  font-weight: 900;
  line-height: 1.5rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #233b5c;
}

.painel-do-parlamentar__botao {
  height: 2.9rem;
  margin-bottom: 0.1rem;
}

.painel-do-parlamentar__botao--pequeno {
  height: 2.3rem;
  margin-bottom: 0.2rem;
}

.painel-do-parlamentar__grade {
  display: grid;
  grid-template-columns: 506fr 558fr;
  grid-template-areas:
    'transferencias recurso'
    'coluna secretaria';
  gap: 3.4rem 3.3rem;
  margin-bottom: 5.3rem;
}

.painel-do-parlamentar__transferencias {
  grid-area: transferencias;
  min-height: 14rem;
}

.painel-do-parlamentar__recurso {
  grid-area: recurso;
  min-height: 14rem;
}

.painel-do-parlamentar__coluna {
  grid-area: coluna;
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.painel-do-parlamentar__participacao {
  min-height: 12.9rem;
}

.painel-do-parlamentar__partido {
  min-height: 25.4rem;
}

.painel-do-parlamentar__secretaria {
  grid-area: secretaria;
  min-height: 40.1rem;

  :deep(.painel-cartao__conteudo) {
    flex-grow: 0;
  }
}

.painel-do-parlamentar__contagem {
  margin: 0;
  padding: 0.6rem 0 0.3rem;
  font-family: 'Roboto Slab', serif;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
}

.painel-do-parlamentar__em-andamento {
  font-size: 5.7rem;
  color: @c500;
}

.painel-do-parlamentar__total {
  margin-left: 0.4rem;
  font-size: 4.1rem;
  color: @c400;
}

.painel-do-parlamentar__disponibilizado {
  margin: 1rem 0 1.1rem 0.3rem;
  font-size: 1rem;
  line-height: 1;
  color: @cinza-medio;
}

.painel-do-parlamentar__disponibilizado-rotulo {
  font-size: 0.9rem;
  font-weight: 300;
  color: #333;
}

.painel-do-parlamentar__barra {
  margin: 0 0 2.3rem 0.3rem;
}

.painel-do-parlamentar__participacao .painel-do-parlamentar__barra {
  margin: 2.1rem 0 1.4rem;
}

.painel-do-parlamentar__vazio {
  margin: 1.7rem 0;
  text-align: center;
  color: @c400;
}

.painel-do-parlamentar__cabecalho-da-lista {
  display: flex;
  align-items: center;
  gap: 1.3rem;
}

.painel-do-parlamentar__titulo-da-lista {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.9rem;
  white-space: nowrap;
  color: @primary;
}

.painel-do-parlamentar__cabecalho-da-lista::after {
  content: '';
  flex-grow: 1;
  margin: 0;
  border: 0;
  border-top: 0.1rem solid @c500;
}

.painel-do-parlamentar__ordenacao {
  order: 1;
  padding-bottom: 2.1rem;
}

.painel-do-parlamentar__ordenacao-campos {
  display: flex;
  align-items: flex-end;
  gap: 1.1rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.painel-do-parlamentar__transferencias-lista {
  display: flex;
  flex-direction: column;
  gap: 1.7rem;
}

.painel-do-parlamentar__paginacao {
  margin-top: 5.1rem;
}
</style>
