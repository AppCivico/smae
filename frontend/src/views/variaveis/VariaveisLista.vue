<script setup>
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import FiltroDeDeVariaveis from '@/components/variaveis/FiltroDeDeVariaveis.vue';
import { variavelGlobal as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';
import { storeToRefs } from 'pinia';
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const alertStore = useAlertStore();
const authStore = useAuthStore();
const variaveisGlobaisStore = useVariaveisGlobaisStore();

const { temPermissãoPara } = storeToRefs(authStore);

const {
  lista, chamadasPendentes, erros, paginacao,
} = storeToRefs(variaveisGlobaisStore);

async function excluirVariavel(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover a variável "${nome}"?`, async () => {
    if (await variaveisGlobaisStore.excluirItem(id)) {
      variaveisGlobaisStore.buscarTudo();
      alertStore.success('Portfólio removido.');
    }
  }, 'Remover');
}

watchEffect(() => {
  variaveisGlobaisStore.buscarTudo({
    assuntos: route.query.assuntos,
    codigo: route.query.codigo,
    descricao: route.query.descricao,
    meta_id: route.query.meta_id,
    orgao_id: route.query.orgao_id,
    orgao_proprietario_id: route.query.orgao_proprietario_id,
    nivel_regionalizacao: route.query.nivel_regionalizacao,
    palavra_chave: route.query.palavra_chave,
    periodicidade: route.query.periodicidade,
    plano_setorial_id: route.query.plano_setorial_id,
    regiao_id: route.query.regiao_id,
    titulo: route.query.titulo,

    pagina: route.query.pagina,

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
            {{ schema.fields.titulo?.spec.label }}
          </th>
          <th>
            {{ schema.fields.fonte_id?.spec.label }}
          </th>
          <th class="cell--nowrap">
            {{ schema.fields.periodicidade?.spec.label }}
          </th>
          <th class="cell--nowrap">
            {{ schema.fields.orgao_id?.spec.label }}
          </th>
          <th>
            Uso
          </th>
          <th>
            Planos
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
            {{ item.titulo }}
          </th>
          <td>
            {{ item.fonte?.nome || item.fonte || '-' }}
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
            {{ item.planos.length || '-' }}
          </td>
          <td>
            <template v-if="Array.isArray(item.planos)">
              <component
                :is="temPermissãoPara([
                  'CadastroPS.administrador',
                  'CadastroPS.administrador_no_orgao'
                ])
                  ? 'router-link'
                  : 'span'"
                v-for="plano in item.planos"
                :key="plano.id"
                :to="{ name: 'planosSetoriaisResumo', params: { planoSetorialId: plano.id } }"
              >
                {{ plano.nome }}
              </component>
            </template>
          </td>
          <td>
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </td>
          <td>
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
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
