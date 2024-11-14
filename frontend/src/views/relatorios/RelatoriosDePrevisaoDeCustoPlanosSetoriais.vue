<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { localizarDataHorario } from '@/helpers/dateToDate';
import { relatorioPlanoSetorialBase as schema } from '@/consts/formSchemas';

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());

const fonte = 'PSPrevisaoCusto';

const campos = computed(() => schema.fields);

const lista = computed(() => relatoriosStore.lista.map((item) => ({
  id: item.id,
  criado_em: localizarDataHorario(item.criado_em, 'dd/MM/yyyy'),
  criador: item.criador.nome_exibicao,
  parametros: `Ano Referência: ${item.parametros.ano}`,
  arquivo: item.arquivo,
})));

function excluirRelatório(id) {
  alertStore.confirmAction('Deseja remover o relatório?', () => {
    relatoriosStore.delete(id);
  }, 'Remover');
}

async function iniciar() {
  relatoriosStore.$reset();
  relatoriosStore.getAll({ fonte });
}
iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.PlanoSetorial') "
      :to="{ name: 'novoRelatórioDePrevisãoDeCustoPlanosSetoriais' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>

  <p class="texto--explicativo">
    SMAE gera uma planilha contendo os registros de previsão de custo registrados nas metas
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
              >
                <use xlink:href="#i_remove" />
              </svg>
            </button>
          </td>
        </tr>
      </template>
      <tr v-else-if="relatoriosStore.loading">
        <td
          colspan="100%"
          aria-busy="true"
        >
          Carregando
        </td>
      </tr>
      <tr v-else-if="relatoriosStore.error">
        <td colspan="100%">
          erro: {{ relatoriosStore.error }}
        </td>
      </tr>
      <tr v-else>
        <td colspan="100%">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>

  <BotãoParaCarregarMais :fonte="fonte" />
</template>
