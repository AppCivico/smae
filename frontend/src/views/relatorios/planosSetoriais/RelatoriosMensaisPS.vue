<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import SmaeLink from '@/components/SmaeLink.vue';
import dateToDate from '@/helpers/dateToDate';
import { useAuthStore } from '@/stores/auth.store';
import { usePlanosSimplificadosStore } from '@/stores/planosMetasSimplificados.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';

const planosMetasSimplificadosStore = usePlanosSimplificadosStore();
const { planosPorId } = storeToRefs(planosMetasSimplificadosStore);

const { temPermissãoPara } = storeToRefs(useAuthStore());

const relatoriosStore = useRelatoriosStore();

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const localizeDate = (d) => dateToDate(d, { timeStyle: 'short' });

function excluirRelatório(id) {
  alertStore.confirmAction('Deseja remover o relatório?', () => {
    relatoriosStore.delete(id);
  }, 'Remover');
}

const fonte = 'PSMonitoramentoMensal';

relatoriosStore.$reset();
relatoriosStore.getAll({ fonte });
</script>
<template>
  <header class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <SmaeLink
      :to="{ name: 'planoSetorial.novoRelatórioMensal' }"
      class="btn big ml2"
    >
      Novo relatório
    </SmaeLink>
  </header>

  <p class="texto--explicativo">
    SMAE gera um conjunto de 4 planilhas contendo os dados do ciclo mensal de
    monitoramento físico do mês informado.
  </p>

  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <col class="col--dataHora">
      <col
        v-if="temPermissãoPara(['Reports.remover.'])"
        class="col--botão-de-ação"
      >
      <col class="col--botão-de-ação">
    </colgroup>
    <thead>
      <tr>
        <th>mês/ano</th>
        <th>Plano</th>
        <th>gerado em</th>
        <th v-if="temPermissãoPara(['Reports.remover.'])" />
        <th />
      </tr>
    </thead>
    <tbody>
      <template v-if="relatoriosStore.lista.length">
        <tr
          v-for="item in relatoriosStore.lista"
          :key="item.id"
        >
          <td>{{ item.parametros.mes }}/{{ item.parametros.ano }}</td>
          <td>
            {{ planosPorId[item.parametros?.plano_setorial_id]?.nome || '-' }}
          </td>
          <td>{{ localizeDate(item.criado_em) }}</td>
          <td v-if="temPermissãoPara(['Reports.remover.'])">
            <button
              class="like-a__text addlink"
              arial-label="excluir"
              title="excluir"
              @click="excluirRelatório(item.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
          <td>
            <a
              :href="`${baseUrl}/download/${item.arquivo}`"
              download
              title="baixar"
            ><img
              src="../../../assets/icons/baixar.svg"
            ></a>
          </td>
        </tr>
      </template>
      <tr v-else-if="relatoriosStore.loading">
        <td
          :colspan="temPermissãoPara(['Reports.remover.']) ? 5 : 4"
          aria-busy="true"
        >
          Carregando
        </td>
      </tr>
      <tr v-else-if="relatoriosStore.error">
        <td :colspan="temPermissãoPara(['Reports.remover.']) ? 5 : 4">
          erro: {{ relatoriosStore.error }}
        </td>
      </tr>
      <tr v-else>
        <td :colspan="temPermissãoPara(['Reports.remover.']) ? 5 : 4">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>

  <BotãoParaCarregarMais :fonte="fonte" />
</template>
