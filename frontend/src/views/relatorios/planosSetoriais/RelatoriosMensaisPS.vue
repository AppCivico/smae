<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import SmaeLink from '@/components/SmaeLink.vue';
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import { localizarDataHorario } from '@/helpers/dateToDate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { usePlanosSimplificadosStore } from '@/stores/planosMetasSimplificados.store';
import { relatorioMensalPlanoSetorial as schema } from '@/consts/formSchemas';
import combinadorDeListas from '@/helpers/combinadorDeListas';

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();
const planosMetasSimplificadosStore = usePlanosSimplificadosStore();
const { planosPorId } = storeToRefs(planosMetasSimplificadosStore);
const { temPermissãoPara } = storeToRefs(useAuthStore());

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const campos = computed(() => schema.fields);

const lista = computed(() => relatoriosStore.lista.map((item) => ({
  id: item.id,
  criado_em: localizarDataHorario(item.criado_em, 'dd/MM/yyyy'),
  criador: item.criador.nome_exibicao,
  referencia: `${item.parametros.mes}/${item.parametros.ano}`,
  parametros: `Meta: ${combinadorDeListas(
    planosPorId.value[item.parametros.plano_setorial_id]?.metas || [],
    ', ',
    'codigo',
  )}`,
  arquivo: item.arquivo,
})));

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
    O SMAE gera um conjunto de 4 planilhas, contendo os dados do ciclo mensal de monitoramento
    físico do mês informado, considerando somente as variáveis que estiverem LIBERADAS.
  </p>

  <table class="tablemain">
    <thead>
      <tr>
        <th
          v-for="(campo, campoIndex) in campos"
          :key="`relatorio-mensal__head--${campoIndex}`"
        >
          {{ campo.spec.label }}
        </th>
        <th />
        <th v-if="temPermissãoPara(['Reports.remover.'])" />
      </tr>
    </thead>
    <tbody>
      <template v-if="lista.length">
        <tr
          v-for="item in lista"
          :key="item.id"
        >
          <td
            v-for="(_, campoIndex) in campos"
            :key="`relatorio-mensal__body--${campoIndex}`"
          >
            {{ item[campoIndex] }}
          </td>

          <td class="tc">
            <a
              :href="`${baseUrl}/download/${item.arquivo}`"
              download
              title="baixar"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_baixar" /></svg>
            </a>
          </td>

          <td
            v-if="temPermissãoPara(['Reports.remover.'])"
            class="tc"
          >
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
