<script setup>
import FeedbackEmptyList from '@/components/FeedbackEmptyList.vue';
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePanoramaStore } from '@/stores/panorama.store.ts';

const panoramaStore = usePanoramaStore();
const {
  perfil,
  variáveisPorId,
  chamadasPendentes,
} = storeToRefs(panoramaStore);

const idsDosItensAbertos = ref([]);

const dadosDeÍcones = {
  Envio: {
    cor: '#f2890d',
    mensagem: 'Aguarda envio',
  },
  Conferência: {
    cor: '#4074bf',
    mensagem: 'Aguarda conferência',
  },
  Preenchimento: {
    cor: '#ee3b2b',
    mensagem: 'Aguarda preenchimento',
  },
  erro: {
    cor: '#3b5881',
    mensagem: 'ERRO DE CÁLCULO!',
  },
};

const calcularDadosDoÍcone = ({
  aguardaComplementação,
  aguardaConferência,
  aguardaEnvio,
  aguardaPreenchimento,
}) => {
  switch (perfil.value) {
    case 'ponto_focal':
      if (aguardaPreenchimento) {
        return dadosDeÍcones.Preenchimento;
      }
      if (aguardaEnvio) {
        return dadosDeÍcones.Envio;
      }
      return dadosDeÍcones.erro;

    default:
      if (aguardaConferência && !aguardaComplementação) {
        return dadosDeÍcones.Conferência;
      }
      if (aguardaEnvio) {
        return dadosDeÍcones.Envio;
      }
      if (aguardaPreenchimento) {
        return dadosDeÍcones.Preenchimento;
      }
      return dadosDeÍcones.erro;
  }
};

//  pendentes:
//    para o ponto focal:
//      - total - enviadas + aguardando complementação
//    para os outros:
//      - total - conferidas + aguardando complementação
const listaDePendentes = computed(() => {
  if (!perfil.value) return [];

  const aRemover = perfil.value === 'ponto_focal'
    ? 'enviadas'
    : 'conferidas';

  return panoramaStore.listaDePendentes.map((x) => {
    const listaBase = perfil.value !== 'ponto_focal' && x.fase === 'Coleta'
      ? 'enviadas'
      : 'total';

    return {
      id: x.id,
      código: x.codigo,
      título: x.titulo,

      riscoEnviado: x.risco_enviado,
      fechamentoEnviado: x.fechamento_enviado,
      analiseQualitativaEnviada: x.analise_qualitativa_enviada,

      atualizadoEm: x.atualizado_em,

      variáveis: x.variaveis?.[listaBase]?.reduce((acc, cur) => {
        const manter = x.variaveis.aguardando_complementacao.includes(cur);
        const remover = !x.variaveis[aRemover].includes(cur);

        const aguardaComplementação = manter;
        const aguardaConferência = !x.variaveis.conferidas.includes(cur);
        const aguardaEnvio = !x.variaveis.enviadas.includes(cur);
        const aguardaPreenchimento = !x.variaveis.preenchidas.includes(cur);

        return (manter || remover)
          ? acc.concat([{
            id: cur,
            código: variáveisPorId.value[cur]?.codigo || '',
            título: variáveisPorId.value[cur]?.titulo || '',
            aguardaComplementação,
            aguardaConferência,
            aguardaEnvio,
            aguardaPreenchimento,
            ícone: calcularDadosDoÍcone({
              aguardaComplementação,
              aguardaConferência,
              aguardaEnvio,
              aguardaPreenchimento,
            }),
          }])
          : acc;
      }, [])
        .sort((a, b) => a.código.localeCompare(b.código)),
    };
  });
});
</script>
<template>
  <Transition name="fade">
    <LoadingComponent v-if="chamadasPendentes.lista" />

    <FeedbackEmptyList
      v-else-if="!listaDePendentes.length"
      título="Bom trabalho!"
      tipo="positivo"
      mensagem="Você não possui pendências!"
    />

    <ul
      v-else
      class="uc w700"
    >
      <li
        v-for="meta in listaDePendentes"
        :key="meta.id"
      >
        <input
          :id="`pendente--${meta.id}`"
          v-model="idsDosItensAbertos"
          type="checkbox"
          :value="meta.id"
          :aria-label="idsDosItensAbertos.includes(meta.id)
            ? `fechar variáveis da meta ${meta.código}`
            : `abrir variáveis da meta ${meta.código}`"
          :title="idsDosItensAbertos.includes(meta.id)
            ? `fechar variáveis da meta ${meta.código}`
            : `abrir variáveis da meta ${meta.código}`"
          :disabled="!meta.variáveis.length"
          class="accordion-opener"
        >
        <label
          :for="`pendente--${meta.id}`"
          class="block mb1 bgc50 br6 p1 g1 flex center"
        >
          <template v-if="perfil !== 'ponto_focal'">
            <router-link
              v-if="meta.analiseQualitativaEnviada !== null"
              :to="{
                name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
                params: {
                  meta_id: meta.id
                }
              }"
              class="f0 tipinfo"
            >
              <svg
                class="meta__icone"
                :color="meta.analiseQualitativaEnviada
                  ? '#8ec122'
                  : '#ee3b2b'"
                width="24"
                height="24"
              ><use xlink:href="#i_iniciativa" /></svg><div>Qualificação</div>
            </router-link>
            <router-link
              v-if="meta.riscoEnviado !== null"
              :to="{
                name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
                params: {
                  meta_id: meta.id
                }
              }"
              class="f0 tipinfo"
            >
              <svg
                class="meta__icone"
                :color="meta.riscoEnviado
                  ? '#8ec122'
                  : '#ee3b2b'"
                width="24"
                height="24"
              ><use xlink:href="#i_binoculars" /></svg><div>Análise de Risco</div>
            </router-link>
            <router-link
              v-if="meta.fechamentoEnviado !== null"
              :to="{
                name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
                params: {
                  meta_id: meta.id
                }
              }"
              class="f0 tipinfo"
            >
              <svg
                class="meta__icone"
                :color="meta.fechamentoEnviado
                  ? '#8ec122'
                  : '#ee3b2b'"
                width="24"
                height="24"
              ><use xlink:href="#i_check" /></svg><div>Fechamento</div>
            </router-link>
          </template>
          {{ meta.código }} - {{ meta.título }}
          <small
            v-if="meta.atualizadoEm"
            v-ScrollLockDebug
          >
            (<code>meta.atualizado_em:&nbsp;{{ meta.atualizadoEm }}</code>)
          </small>
        </label>
        <Transition
          v-if="meta.variáveis.length"
          name="fade"
        >
          <ul
            v-if="idsDosItensAbertos.includes(meta.id)"
            class="pl2"
          >
            <li
              v-for="variável in meta.variáveis"
              :key="variável.id"
              class="mb1 bgc50 br6 p1 flex start"
            >
              <span
                class="tipinfo ib mr1 f0"
                :class="{
                  tipinfo: !!variável.ícone.mensagem
                }"
              >
                <svg
                  width="20"
                  height="20"
                  :color="variável.ícone.cor"
                ><use
                  :xlink:href="variável.aguardaComplementação
                    ? '#i_alert'
                    : '#i_circle'"
                /></svg>
                <div v-if="variável.ícone.mensagem">
                  {{ variável.ícone.mensagem }}
                </div>
              </span>
              <router-link
                :to="{
                  name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
                  params: {
                    meta_id: meta.id
                  }
                }"
              >
                {{ variável.código || variável.id }} - {{ variável.título }}
              </router-link>
              <small v-ScrollLockDebug>
                (<code>aguardaComplementação:&nbsp;{{ variável.aguardaComplementação }}</code>)
                (<code>aguardaConferência:&nbsp;{{ variável.aguardaConferência }}</code>)
                (<code>aguardaEnvio:&nbsp;{{ variável.aguardaEnvio }}</code>)
                (<code>aguardaPreenchimento:&nbsp;{{ variável.aguardaPreenchimento }}</code>)
              </small>
            </li>
          </ul>
        </Transition>
      </li>
    </ul>
  </Transition>
</template>
