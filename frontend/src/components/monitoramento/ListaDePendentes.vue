<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePanoramaStore } from '@/stores/panorama.store.ts';

const panoramaStore = usePanoramaStore();
const {
  listaDePendentes,
  perfil,
  variáveisPorId,
} = storeToRefs(panoramaStore);

const idDoItemAberto = ref(0);

//  pendentes:
//    para o ponto focal:
//      - total - enviadas + aguardando complementação
//    para os outros:
//      - total - conferidas + aguardando complementação
const lista = computed(() => {
  if (!perfil.value) return [];

  const aRemover = perfil.value === 'ponto_focal'
    ? 'enviadas'
    : 'conferidas';
  return listaDePendentes.value.map((x) => ({
    id: x.id,
    código: x.codigo,
    título: x.titulo,
    variáveis: x.variaveis?.total?.reduce((acc, cur) => {
      const manter = x.variaveis.aguardando_complementacao.includes(cur);
      const remover = !x.variaveis[aRemover].includes(cur);
      return (manter || remover)
        ? acc.concat([{
          id: cur,
          código: variáveisPorId.value[cur]?.codigo || '',
          título: variáveisPorId.value[cur]?.titulo || '',
          aguardaComplementação: manter,
          aguardaConferência: x.variaveis.conferidas.includes(cur),
          aguardaEnvio: x.variaveis.enviadas.includes(cur),
          aguardaPreenchimento: x.variaveis.preenchidas.includes(cur),
        }])
        : acc;
    }, [])
      .sort((a, b) => a.código.localeCompare(b.código))
    ,
  }));
});
</script>
<template>
  <ul
    class="uc w700"
  >
    <li
      v-for="meta in lista"
      :key="meta.id"
    >
      <span class="block mb1 bgc50 br6 p1 flex start">
        <button
          class="like-a__text addlink ib f0"
          :arial-label="idDoItemAberto === meta.id
            ? `fechar variáveis da meta ${meta.código}`
            : `abrir variáveis da meta ${meta.código}`"
          :title="idDoItemAberto === meta.id
            ? `fechar variáveis da meta ${meta.código}`
            : `abrir variáveis da meta ${meta.código}`"
          type="button"
          :disabled="!meta.variáveis.length"
          @click="idDoItemAberto = idDoItemAberto !== meta.id
            ? meta.id
            : 0"
        >
          <svg
            width="13"
            height="13"
          ><use
            :xlink:href="idDoItemAberto === meta.id ? '#i_down' : '#i_right'"
          /></svg>
        </button>
        {{ meta.código }} - {{ meta.título }}
      </span>
      <Transition
        v-if="meta.variáveis.length"
        name="fade"
      >
        <ul
          v-if="idDoItemAberto === meta.id"
          class="pl2"
        >
          <li
            v-for="variável in meta.variáveis"
            :key="variável.id"
            class="mb1 bgc50 br6 p1 flex start"
          >
            <span
              v-if="variável.aguardaPreenchimento"
              class="tipinfo ib mr1 f0"
            >
              <svg
                width="20"
                height="20"
                color="#f2890d"
              ><use xlink:href="#i_alert" /></svg>
              <div>Aguarda preenchimento</div>
            </span>
            <span
              v-else-if="variável.aguardaComplementação"
              class="tipinfo ib mr1 f0"
            >
              <svg
                width="20"
                height="20"
                color="#ee3b2b"
              ><use xlink:href="#i_alert" /></svg>
              <div>Aguarda coleta</div>
            </span>
            <span
              v-else-if="variável.aguardaConferência"
              class="tipinfo ib mr1 f0"
            >
              <svg
                width="20"
                height="20"
                color="#4c626d"
              ><use xlink:href="#i_alert" /></svg>
              <div>Aguarda complementação</div>
            </span>
            <span
              v-else-if="variável.aguardaEnvio"
              class="tipinfo ib mr1 f0"
            >
              <svg
                width="20"
                height="20"
                color="#f2890d"
              ><use xlink:href="#i_circle" /></svg>
              <div>Aguarda envio</div>
            </span>
            {{ variável.código || variável.id }} - {{ variável.título }}
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
</template>
