<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
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
    <TituloDaPagina />

    <hr class="ml2 f1">

    <router-link
      v-if="temPermissãoPara([
        'Reports.executar.PlanoSetorial',
        'Reports.executar.ProgramaDeMetas'
      ]) "
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

          <td class="tr">
            <button
              v-if="temPermissãoPara(['Reports.remover.'])"
              class="like-a__text addlink"
              arial-label="excluir"
              title="excluir"
              @click="excluirRelatório(item.id)"
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_waste" />
              </svg>
            </button>

            <a
              class="ml1"
              :href="`${baseUrl}/download/${item.arquivo}`"
              download
              title="baixar"
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_baixar" />
              </svg>
            </a>
          </td>
        </tr>
      </template>
      <tr v-else-if="relatoriosStore.loading">
        <td
          colspan="999"
          aria-busy="true"
        >
          Carregando
        </td>
      </tr>
      <tr v-else-if="relatoriosStore.error">
        <td colspan="999">
          erro: {{ relatoriosStore.error }}
        </td>
      </tr>
      <tr v-else>
        <td colspan="999">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>

  <BotãoParaCarregarMais :fonte="fonte" />
</template>
