<script setup>
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import FiltroDeDeVariaveis from '@/components/variaveis/FiltroDeDeVariaveis.vue';
import { variável } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { usePsVariaveisStore } from '@/stores/ps.variaveis.store.ts';
import { storeToRefs } from 'pinia';
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const alertStore = useAlertStore();

const psVariaveisStore = usePsVariaveisStore();
const {
  lista, chamadasPendentes, erros, paginacao,
} = storeToRefs(psVariaveisStore);

const schema = variável();

async function excluirPlano(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover a variável "${nome}"?`, async () => {
    if (await psVariaveisStore.excluirItem(id)) {
      psVariaveisStore.buscarTudo();
      alertStore.success('Portfólio removido.');
    }
  }, 'Remover');
}

watchEffect(() => {
  psVariaveisStore.buscarTudo({
    assuntos: route.query.assuntos,
    codigo: route.query.codigo,
    descricao: route.query.descricao,
    meta_id: route.query.meta_id,
    plano_setorial_id: route.query.plano_setorial_id,
    titulo: route.query.titulo,
    orgao_id: route.query.orgao_id,
    orgao_proprietario_id: route.query.orgao_proprietario_id,
    pagina: route.query.pagina,
    palavra_chave: route.query.palavra_chave,
    regiao_ids: route.query.regiao_ids,
    periodicidade: route.query.periodicidade,

    ipp: route.query.ipp,
    token_paginacao: route.query.token_paginacao,

    ordem_coluna: route.query.ordem_coluna,
    ordem_direcao: route.query.ordem_direcao,
  });
});
</script>
<template>
  <header class="flex spacebetween center mb2 g2">
    <TítuloDePágina id="titulo-da-pagina" />

    <hr class="f1">

    <router-link
      :to="{ name: 'variaveisCriar' }"
      class="btn big ml1"
    >
      Nova variável
    </router-link>
  </header>

  <FiltroDeDeVariaveis :aria-busy="chamadasPendentes.lista" />

  <div
    role="region"
    aria-labelledby="titulo-da-pagina"
    tabindex="0"
  >
    <table class="tablemain tbody-zebra">
      <col>
      <col>
      <col class="col--minimum">
      <col class="col--minimum">
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>
            {{ schema.fields.titulo?.spec.label || 'Campo faltando no schema' }}
          </th>
          <th>
            {{ schema.fields.fonte?.spec.label || 'Campo faltando no schema' }}
          </th>
          <th class="cell--nowrap">
            {{ schema.fields.periodicidade?.spec.label || 'Campo faltando no schema' }}
          </th>
          <th class="cell--nowrap">
            {{ schema.fields.orgao_id?.spec.label || 'Campo faltando no schema' }}
          </th>
          <th>
            {{ schema.fields.uso?.spec.label || 'Campo faltando no schema' }}
          </th>
          <th>
            {{ schema.fields.planos?.spec.label || 'Campo faltando no schema' }}
          </th>
          <th />
          <th />
        </tr>
      </thead>
      <tbody
        v-for="item in lista"
        :key="item.id"
      >
        <tr>
          <th>
            <router-link
              :to="{ name: 'variaveisResumo', params: { variavelId: item.id } }"
            >
              {{ item.titulo }}
            </router-link>
          </th>
          <td>
            {{ item.fonte }}
          </td>
          <td class="cell--nowrap">
            {{ item.periodicidade }}
          </td>
          <td class="cell--nowrap">
            <abbr
              v-if="item.orgao"
              :title="item.orgao.descricao"
            >
              {{ item.orgao.sigla || item.orgao }}
            </abbr>
          </td>
          <td>
            {{ item.uso }}
          </td>
          <td>
            {{ item.planos }}
          </td>
          <td>
            <router-link
              :to="{ name: 'variaveisEditar', params: { variavelId: item.id } }"
              class="tprimary"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </router-link>
          </td>
          <td>
            <button
              class="like-a__text"
              arial-label="excluir"
              title="excluir"
              @click="excluirPlano(item.id, item.nome)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
        </tr>
        <tr v-if="item.metodologia">
          <td
            colspan="8"
            aria-label="schema.fields.metodologia?.spec.label || 'Campo faltando no schema'"
          >
            {{ item.metodologia }}
          </td>
        </tr>
      </tbody>

      <tbody>
        <tr v-if="chamadasPendentes.lista">
          <td colspan="6">
            Carregando
          </td>
        </tr>
        <tr v-else-if="erros.lista">
          <td colspan="6">
            Erro: {{ erros.lista }}
          </td>
        </tr>
        <tr v-else-if="!lista.length">
          <td colspan="6">
            Nenhum resultado encontrado.
          </td>
        </tr>
      </tbody>
    </table>

    <MenuPaginacao
      class="mt2"
      v-bind="paginacao"
    />
  </div>
</template>
