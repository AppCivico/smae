<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import TagsDeMetas from '@/components/metas/TagsDeMetas.vue';
import ListaDeDocumentos from '@/components/monitoramentoDeMetas/ListaDeDocumentos.vue';
import { dateToShortDate } from '@/helpers/dateToDate';
import dateToTitle from '@/helpers/dateToTitle';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';

const route = useRoute();
const router = useRouter();

const props = defineProps({
  ciclo: {
    type: Object,
    default: () => ({}),
  },
  metaId: {
    type: [
      Number,
      String,
    ],
    required: true,
  },
  open: {
    type: Boolean,
    default: false,
  },
  cicloAtual: {
    type: Boolean,
    default: false,
  },
});

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);
const estaAberto = ref(false);

const {
  chamadasPendentes,
  ciclosDetalhadosPorId,
  erros,
} = storeToRefs(monitoramentoDeMetasStore);

const cicloDetalhes = computed(() => ciclosDetalhadosPorId.value?.[props.ciclo.id] || null);

// a API já entrega apenas as fases e os blocos habilitados, em ordem
const fases = computed(() => cicloDetalhes.value?.fases || []);

function conteudoDoBloco(revisao, blocoId) {
  return revisao?.blocos.find((bloco) => bloco.bloco_id === blocoId)?.conteudo;
}

// no formato esperado pelo `TagsDeMetas`
function tagsParaLista(revisao) {
  return revisao.tags.map((tag) => ({
    id: tag.id,
    descricao: tag.descricao,
    download_token: tag.icone,
    download_token_miniatura: tag.icone_thumbnail,
  }));
}

// a fase que fecha o ciclo exibe também os fechamentos anteriores a reaberturas
function revisoesParaExibir(fase) {
  return [].concat(
    fase.atual ? [fase.atual] : [],
    fase.config.fecha_ciclo ? fase.historico : [],
  );
}

function handleToggle(event) {
  estaAberto.value = event.target.open;
}

// Nem todas as variáveis tem ciclo de monitoramento
if (props.ciclo?.id) {
  watch(() => estaAberto.value, (novoValor) => {
    if (novoValor && !cicloDetalhes.value) {
      monitoramentoDeMetasStore.buscarCiclo(
        route.params.planoSetorialId,
        props.ciclo.id,
        {
          meta_id: route.params.meta_id,
        },
      );
    }
  });
}

async function reabrirCiclo() {
  if (chamadasPendentes.value.reabrirCiclo[props.ciclo.id]) return;

  try {
    const sucesso = await monitoramentoDeMetasStore.reabrirCiclo(
      route.params.planoSetorialId,
      props.ciclo.id,
      {
        meta_id: route.params.meta_id,
      },
    );

    if (sucesso) {
      // Atualizar tanto a lista quanto os detalhes do ciclo exibido
      if (estaAberto.value) {
        monitoramentoDeMetasStore.buscarCiclo(
          route.params.planoSetorialId,
          props.ciclo.id,
          {
            meta_id: route.params.meta_id,
          },
        );
      }

      monitoramentoDeMetasStore.buscarListaDeCiclos(route.params.planoSetorialId, {
        meta_id: route.params.meta_id,
      });

      router.push({
        name: `${route.meta.entidadeMãe}.monitoramentoDeMetasFases`,
        params: {
          ...route.params,
          cicloId: props.ciclo.id,
        },
      });
    } else {
      throw new Error('Falha ao reabrir ciclo');
    }
  } catch (erro) {
    console.error('Erro ao reabrir ciclo:', erro);

    throw erro;
  }
}

onMounted(() => {
  estaAberto.value = props.open;
});
</script>
<template>
  <details
    :id="$attrs.id || (ciclo.id ? `ciclo--${ciclo.id}` : null)"
    :open="$props.open || $props.cicloAtual"
    :class="cicloAtual ? 'ciclo-atual' : 'ciclo-passado'"
    @toggle.prevent="handleToggle"
  >
    <summary
      class="flex flexwrap"
      :class="cicloAtual ? 'ciclo-atual__summary' : ''"
    >
      <div
        v-if="cicloAtual"
        class="titulo-monitoramento"
      >
        <h2 class="tc500 t20 titulo-monitoramento__text">
          <span class="w400">
            Ciclo <template v-if="cicloAtual">atual</template>:
          </span>
          {{ dateToTitle(ciclo.data_ciclo) }}
        </h2>
      </div>

      <h2
        v-else
        class="tc500 t20"
      >
        {{ dateToTitle(ciclo.data_ciclo) }}
      </h2>

      <button
        v-if="ciclo.fechado"
        type="button"
        class="btn outline bgnone tcprimary mtauto align-end mlauto mr0"
        :aria-busy="chamadasPendentes.reabrirCiclo[ciclo.id]"
        :aria-disabled="chamadasPendentes.reabrirCiclo[ciclo.id]"
        @click="reabrirCiclo()"
      >
        Reabrir ciclo
      </button>

      <ErrorComponent
        v-if="erros.reabrirCiclo[ciclo.id]"
        :erro="erros.reabrirCiclo[ciclo.id]"
        class="ml2"
      />
    </summary>
    <LoadingComponent
      v-if="chamadasPendentes.ciclosDetalhadosPorId[ciclo.id]"
      class="mb2"
    />
    <ErrorComponent
      v-else-if="erros.ciclosDetalhadosPorId[ciclo.id]"
      :erro="erros.ciclosDetalhadosPorId[ciclo.id]"
      class="mb2"
    />
    <div
      v-else
      class="details-content"
    >
      <div
        v-for="fase in fases"
        :key="fase.config.id"
        class="details-content__item"
      >
        <div class="flex g2 center mt3 mb2">
          <h3 class="w700 mb0">
            {{ fase.config.rotulo }}
          </h3>
          <hr class="f1">
          <SmaeLink
            v-if="cicloDetalhes.pode_editar && fase.editavel"
            :to="{
              name: `.monitoramentoDeMetasFases`,
              params: { cicloId: ciclo.id },
              query: { aba: `fase-${fase.config.id}` },
            }"
            class="tprimary"
            :title="`Editar ${fase.config.rotulo}`"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_edit" />
            </svg>
          </SmaeLink>
        </div>

        <p
          v-if="!fase.atual"
          class="t12 tc300 w700"
        >
          Fase ainda não preenchida.
        </p>

        <div
          v-for="revisao in revisoesParaExibir(fase)"
          :key="revisao.id"
          class="mb2"
        >
          <dl v-if="fase.config.aceita_tags">
            <div class="mb1">
              <dt class="t12 uc w700 mb05 tc300 sr-only">
                Tags
                <hr class="f1 mt025">
              </dt>
              <dd class="t13">
                <TagsDeMetas
                  v-if="revisao.tags.length"
                  :lista-de-tags="tagsParaLista(revisao)"
                />
                <template v-else>
                  -
                </template>
              </dd>
            </div>
          </dl>
          <dl v-else>
            <div
              v-for="bloco in fase.config.blocos"
              :key="bloco.id"
              class="mb1"
            >
              <dt class="t12 uc w700 mb05 tc300">
                {{ bloco.rotulo }}
                <hr class="f1 mt025">
              </dt>
              <dd
                class="t13 contentStyle"
                v-html="conteudoDoBloco(revisao, bloco.id) || '-'"
              />
            </div>
          </dl>

          <footer
            v-if="revisao.criador?.nome_exibicao || revisao.criado_em"
            class="tc600"
          >
            <p>
              {{ fase.config.fecha_ciclo ? 'Fechado' : 'Preenchido' }}
              <template v-if="revisao.criador?.nome_exibicao">
                por <strong>{{ revisao.criador.nome_exibicao }}</strong>
              </template>
              <template v-if="revisao.criado_em">
                em <time :datetime="revisao.criado_em">
                  {{ dateToShortDate(revisao.criado_em) }}
                </time>.
              </template>
            </p>
          </footer>
        </div>

        <ListaDeDocumentos
          v-if="fase.documentos.length"
          :arquivos="fase.documentos"
        />
      </div>
    </div>
  </details>
</template>
<style lang="less" scoped>
.ciclo-atual__summary::before {
  display: none;
}

.details-content__item {
  margin-block-end: 3rem;
  padding-block-end: 3rem;
  border-block-end: 1px solid #005c8a;
}

.ciclo-passado .details-content__item {
  padding-inline: 1.5rem;
}
</style>
