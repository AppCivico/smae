<template>
  <details
    v-if="props.cicloDados?.id && props.metaId"
    :id="$attrs.id"
    ref="detailsElem"
    :open="$props.open"
    @toggle="estaAberto = !estaAberto"
  >
    <summary>
      <h2 class="tc500 t20 ml05">
        Ciclo {{ dateToTitle($props.cicloDados.data_ciclo) }}
      </h2>
    </summary>
    <div class="details-content">
      <div
        class="mb2"
      >
        <div class="flex g2 center mt3 mb2">
          <h3 class="w700 mb0">
            Análise de risco
          </h3>
          <hr class="f1">
        </div>

        <LoadingComponent
          v-if="chamadasPendentes.risco"
        >
          Carregando dados de riscos...
        </LoadingComponent>

        <ErrorComponent
          v-else-if="erros.risco"
          :erro="erros.risco"
        />

        <dl v-else>
          <div
            class="mb1"
          >
            <dt class="t12 uc w700 mb05 tc300">
              Detalhamento
              <hr class="f1 mt025">
            </dt>
            <dd
              class="t13 contentStyle"
              v-html="risco?.detalhamento || '-'"
            />
          </div>
          <div
            class="mb1"
          >
            <dt class="t12 uc w700 mb05 tc300">
              Ponto de ação
              <hr class="f1 mt025">
            </dt>
            <dd
              class="t13 contentStyle"
              v-html="risco?.ponto_de_atencao || '-'"
            />
          </div>
        </dl>
        <footer
          v-if="risco?.criador?.nome_exibicao || risco?.criado_em"
          class="tc600"
        >
          <p>
            Analisado
            <template v-if="risco.criador?.nome_exibicao">
              por <strong>{{ risco.criador.nome_exibicao }}</strong>
            </template>
            <template v-if="risco.criado_em">
              em <time :datetime="risco.criado_em">{{ dateToShortDate(risco.criado_em) }}</time>.
            </template>
          </p>
        </footer>
      </div>

      <div
        class="mb2"
      >
        <div class="flex g2 center mt3 mb2">
          <h3 class="w700 mb0">
            Qualificação
          </h3>
          <hr class="f1">
        </div>

        <LoadingComponent
          v-if="chamadasPendentes.analise"
        >
          Carregando informações complementares...
        </LoadingComponent>
        <ErrorComponent
          v-else-if="erros.analise"
          :erro="erros.analise"
        />
        <dl v-else>
          <div
            class="mb1"
          >
            <dt class="t12 uc w700 mb05 tc300">
              Informações complementares
              <hr class="f1 mt025">
            </dt>
            <dd
              class="t13 contentStyle mt1"
              v-html="analise?.informacoes_complementares || '-'"
            />
          </div>
        </dl>
        <hr class="f1">
        <footer
          v-if="analise?.criador?.nome_exibicao || analise?.criado_em"
          class="tc600 mt1"
        >
          <p>
            Analisado
            <template v-if="analise.criador?.nome_exibicao">
              por <strong>{{ analise.criador.nome_exibicao }}</strong>
            </template>
            <template v-if="analise.criado_em">
              em <time :datetime="analise.criado_em">{{ dateToShortDate(analise.criado_em) }}</time>.
            </template>
          </p>
          <hr class="f1">
        </footer>

        <table
          v-if="Array.isArray(analiseDocumentos)
            && analiseDocumentos?.length"
          class="tablemain mb1 mt1"
        >
          <col>
          <col>
          <col>
          <col>
          <col>
          <thead>
            <tr>
              <th>Documentos</th>
              <th />
              <th />
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="doc in analiseDocumentos"
              :key="doc.id"
            >
              <td class="flex center">
                <svg
                  width="20"
                  height="20"
                  class="mr1"
                ><use xlink:href="#i_doc" /></svg>
                {{ doc?.arquivo?.nome_original }}
              </td>
              <td>{{ doc.arquivo?.descricao }}</td>
              <td>{{ doc.criador?.nome_exibicao }}</td>
              <td>{{ dateToShortDate(doc.criado_em) }}</td>
              <td>
                <SmaeLink
                  v-if="doc?.arquivo?.download_token"
                  :to="baseUrl + '/download/' + doc?.arquivo?.download_token"
                  download
                >
                  <svg
                    width="20"
                    height="20"
                    class="mr1"
                  ><use xlink:href="#i_download" /></svg>
                </SmaeLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div

        class="mb2"
      >
        <div class="flex g2 center mt3 mb2">
          <h3 class="w700 mb0">
            Fechamento
          </h3>
          <hr class="f1">
        </div>
        <LoadingComponent
          v-if="chamadasPendentes.fechamento"
        >
          Carregando dados de fechamento...
        </LoadingComponent>
        <ErrorComponent
          v-else-if="erros.fechamento"
          :erro="erros.fechamento"
        />
        <dl v-else>
          <div
            class="mb1"
          >
            <dt class="t12 uc w700 mb05 tc300">
              Comentários
            </dt>
            <dd
              class="t13 contentStyle"
              v-html="fechamento?.comentario || '-'"
            />
          </div>
        </dl>
        <footer
          v-if="fechamento?.criador?.nome_exibicao || fechamento?.criado_em"
          class="tc600"
        >
          <p>
            Fechado
            <template v-if="fechamento.criador?.nome_exibicao">
              por <strong>{{ fechamento.criador.nome_exibicao }}</strong>
            </template>
            <template v-if="fechamento.criado_em">
              em <time :datetime="fechamento.criado_em">{{ dateToShortDate(fechamento.criado_em) }}</time>.
            </template>
          </p>
        </footer>
      </div>
    </div>
  </details>
</template>

<script setup>
import { dateToShortDate } from '@/helpers/dateToDate';
import dateToTitle from '@/helpers/dateToTitle';
import requestS from '@/helpers/requestS.ts';
import { onMounted, ref, watch } from 'vue';
import ErrorComponent from '../ErrorComponent.vue';
import LoadingComponent from '../LoadingComponent.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  cicloDados: {
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
});

const chamadasPendentes = ref({
  risco: false,
  analise: false,
  fechamento: false,
});

const erros = ref({
  risco: null,
  analise: null,
  fechamento: null,
});

const detailsElem = ref(null);

const risco = ref(null);
const analise = ref(null);
const analiseDocumentos = ref([]);
const fechamento = ref(null);
const pronto = ref(false);

const estaAberto = ref(false);

function iniciar(cicloId, metaId) {
  if (!cicloId || !metaId) {
    return;
  }

  chamadasPendentes.value.risco = true;
  chamadasPendentes.value.analise = true;
  chamadasPendentes.value.fechamento = true;

  erros.value.risco = null;
  erros.value.analise = null;
  erros.value.fechamento = null;

  const promessas = [
    requestS.get(`${baseUrl}/mf/metas/risco`, {
      ciclo_fisico_id: cicloId,
      meta_id: metaId,
      apenas_ultima_revisao: true,
    })
      .then((response) => {
        if (Array.isArray(response.riscos) && response.riscos[0]) {
          [risco.value] = response.riscos;
        }
      })
      .catch((error) => {
        erros.value.risco = error;
      })
      .finally(() => {
        chamadasPendentes.value.risco = false;
      }),
    requestS.get(`${baseUrl}/mf/metas/fechamento`, {
      ciclo_fisico_id: cicloId,
      meta_id: metaId,
      apenas_ultima_revisao: true,
    })
      .then((response) => {
        if (Array.isArray(response.fechamentos) && response.fechamentos[0]) {
          [fechamento.value] = response.fechamentos;
        }
      })
      .catch((error) => {
        erros.value.fechamento = error;
      })
      .finally(() => {
        chamadasPendentes.value.fechamento = false;
      }),
    requestS.get(`${baseUrl}/mf/metas/analise-qualitativa`, {
      ciclo_fisico_id: cicloId,
      meta_id: metaId,
      apenas_ultima_revisao: true,
    })
      .then((response) => {
        if (Array.isArray(response.analises) && response.analises[0]) {
          [analise.value] = response.analises;
        }
        if (Array.isArray(response.arquivos)) {
          analiseDocumentos.value = response.arquivos;
        }
      })
      .catch((error) => {
        erros.value.analise = error;
      })
      .finally(() => {
        chamadasPendentes.value.analise = false;
      }),
  ];

  Promise.allSettled(promessas).then(() => {
    pronto.value = true;
  });
}

onMounted(() => {
  // definindo o valor inicial na mão e redefinindo num evento porque o
  // atributo open do `<details>` deixa de existir quando o componente é fechado
  // e perder a reatividade
  estaAberto.value = detailsElem.value?.open;
});

watch(() => estaAberto.value, (novoValor) => {
  if (novoValor) {
    iniciar(props.cicloDados?.id, props.metaId);
  }
}, { once: true });

watch([() => props.cicloDados?.id, () => props.metaId], ([novoCiclo, novaMeta]) => {
  if (props.open) {
    iniciar(novoCiclo, novaMeta);
  }
}, { immediate: true });
</script>
<style scoped></style>
