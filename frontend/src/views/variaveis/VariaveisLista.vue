<script setup>
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import FiltroDeDeVariaveis from '@/components/variaveis/FiltroDeDeVariaveis.vue';
import { variavelGlobal as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/truncate';
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
      <col class="col--minimum">
      <col>
      <col>
      <col class="col--minimum">
      <col class="col--minimum">
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>
            Código
          </th>
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
          <td class="cell--nowrap">
            {{ item.codigo }}
          </td>
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
          <td class="contentStyle">
            <ul v-if="Array.isArray(item.planos)">
              <li
                v-for="plano in item.planos"
                :key="plano.id"
              >
                <component
                  :is="temPermissãoPara([
                    'CadastroPS.administrador',
                    'CadastroPS.administrador_no_orgao'
                  ])
                    ? 'router-link'
                    : 'span'"
                  :to="{
                    name: 'planosSetoriaisResumo', params: {
                      planoSetorialId:
                        plano.id
                    }
                  }"
                  :title="plano.nome?.length > 36 ? plano.nome : null"
                >
                  {{ truncate(plano.nome, 36) }}
                </component>
              </li>
            </ul>
          </td>
          <td>
            <router-link
              v-if="item.pode_editar"
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
              v-if="item.pode_excluir"
              class="like-a__text"
              arial-label="excluir"
              title="excluir"
              @click="excluirVariavel(item.id, item.titulo)"
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
          <td colspan="8">
            Carregando
          </td>
        </tr>
        <tr v-else-if="erros.lista">
          <td colspan="8">
            Erro: {{ erros.lista }}
          </td>
        </tr>
        <tr v-else-if="!lista.length">
          <td colspan="8">
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
