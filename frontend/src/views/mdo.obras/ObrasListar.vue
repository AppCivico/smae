<template>
  <div>
    <header class="flex spacebetween center mb2 g2">
      <TítuloDePágina id="titulo-da-pagina" />
      <hr class="f1">
      <router-link
        :to="{name: 'obrasCriar'}"
        class="btn big ml1"
      >
        Nova obra
      </router-link>
    </header>

    <FormularioQueryString
      v-slot="{ capturarEnvio }"
      :valores-iniciais="{
        ordem_direcao: 'asc',
        ipp: gblIpp,
        pagina: 1,
        token_paginacao: undefined,
      }"
    >
      <FiltroDeListagemDeObras
        :aria-busy="chamadasPendentes.lista"
        :valores-iniciais="{
          ipp: $route.query.ipp || 100,
          ordem_coluna: $route.query.codigo || 'codigo',
          ordem_direcao: $route.query.ordem_direcao || 'asc',
          regiao_id: $route.query.regiao_id,
        }"
        @submit="capturarEnvio"
      />
    </FormularioQueryString>

    <div
      role="region"
      aria-labelledby="titulo-da-pagina"
      tabindex="0"
    >
      <table class="tablemain">
        <col>
        <col>
        <col>
        <col>
        <col>
        <col>
        <col>
        <col>

        <col class="col--botão-de-ação">
        <col class="col--botão-de-ação">
        <thead>
          <tr>
            <th>
              {{ schema.fields.orgao_origem_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.portfolio_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.nome.spec.label }}
            </th>
            <th>
              {{ schema.fields.grupo_tematico_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.tipo_intervencao_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.equipamento_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.regiao_ids.spec.label }}
            </th>
            <th>
              {{ schema.fields.status.spec.label }}
            </th>
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in lista"
            :key="item.id"
          >
            <td>{{ item.orgao_origem.sigla }}</td>
            <td>{{ item.portfolio?.titulo || item.portfolio }}</td>
            <th>
              <router-link
                :to="{ name: 'obrasResumo', params: { obraId: item.id } }"
              >
                {{ item.nome }}
              </router-link>
            </th>
            <td>{{ item.grupo_tematico.nome }}</td>
            <td>
              {{ item.tipo_intervencao?.nome || item.tipo_intervencao || ' - ' }}
            </td>
            <td>
              {{ item.equipamento ? item.equipamento.nome : ' - ' }}
            </td>
            <td>
              {{ item.regioes || ' - ' }}
            </td>
            <td class="cell--minimum">
              {{ statusObras[item.status]?.nome || item.status }}
            </td>

            <td>
              <router-link
                :to="{ name: 'obrasEditar', params: { obraId: item.id } }"
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
                aria-label="excluir"
                title="excluir"
                @click="excluirObra(item.id, item.nome)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </td>
          </tr>
          <tr v-if="chamadasPendentes.lista">
            <td colspan="10">
              Carregando
            </td>
          </tr>
          <tr v-else-if="erro">
            <td colspan="10">
              Erro: {{ erro }}
            </td>
          </tr>
          <tr v-else-if="!lista.length">
            <td colspan="10">
              Nenhum resultado encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <MenuPaginacao
      class="mt2"
      v-bind="paginacao"
    />
  </div>
</template>
<script setup>
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import FiltroDeListagemDeObras from '@/components/obras/FiltroDeListagemDeObras.vue';
import { obras as schema } from '@/consts/formSchemas';
import statusObras from '@/consts/statusObras';
import { useAlertStore } from '@/stores/alert.store';
import { useObrasStore } from '@/stores/obras.store';
import { storeToRefs } from 'pinia';
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const obrasStore = useObrasStore();

const {
  lista, chamadasPendentes, erro, paginacao,
} = storeToRefs(obrasStore);
const alertStore = useAlertStore();

async function excluirObra(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover "${nome}"?`, async () => {
    if (await obrasStore.excluirItem(id)) {
      obrasStore.buscarTudo();
      alertStore.success('Obra removida.');
    }
  }, 'Remover');
}

watchEffect(() => {
  obrasStore.buscarTudo({
    codigo: route.query.codigo,
    equipamento_id: route.query.equipamento_id,
    grupo_tematico_id: route.query.grupo_tematico_id,
    ipp: route.query.ipp,
    nome: route.query.nome,
    ordem_coluna: route.query.ordem_coluna,
    ordem_direcao: route.query.ordem_direcao,
    orgao_origem_id: route.query.orgao_origem_id,
    orgao_responsavel_id: route.query.orgao_responsavel_id,
    pagina: route.query.pagina,
    palavra_chave: route.query.palavra_chave,
    portfolio_id: route.query.portfolio_id,
    regioes: route.query.regioes,
    status: route.query.status,
    tipo_intervencao_id: route.query.tipo_intervencao_id,
    token_paginacao: route.query.token_paginacao,
  });
});
</script>
