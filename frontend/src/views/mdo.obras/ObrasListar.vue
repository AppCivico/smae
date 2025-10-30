<template>
  <div>
    <CabecalhoDePagina>
      <template #acoes>
        <SmaeLink
          :to="{
            name: 'obrasCriar'
          }"
          class="btn big"
        >
          Nova obra
        </SmaeLink>
      </template>
    </CabecalhoDePagina>

    <FormularioQueryString
      v-slot="{ aplicarQueryStrings, detectarMudancas, formularioSujo }"
      :valores-iniciais="{
        ipp: gblIpp,
        pagina: 1,
        token_paginacao: undefined,
        ordem_coluna: 'registrado_em',
        ordem_direcao: 'desc',
      }"
    >
      <FiltroDeListagemDeObras
        :aria-busy="chamadasPendentes.lista"
        :class="{ 'formulario-sujo': formularioSujo }"
        @submit="aplicarQueryStrings"
        @campo-mudou="detectarMudancas"
      />
    </FormularioQueryString>

    <MenuPaginacao
      class="mt2 bgb"
      v-bind="paginacao"
    />

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
            <th
              v-if="temPermissãoPara(['ProjetoMDO.administrador', 'MDO.revisar_obra'])"
            >
              Revisada
            </th>
            <th
              v-if="temPermissãoPara(['ProjetoMDO.administrador', 'MDO.revisar_obra'])"
            >
              <button
                class="btn outline bgnone tcprimary mtauto align-end mlauto mr0"
                @click="marcarTodasComoNaoRevisadas"
              >
                Desmarcar todas
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in lista"
            :key="item.id"
            :class="{ 'selecionado': item.id == ultimoVistoId }"
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
            <td class="text-center">
              <input
                v-if="temPermissãoPara(['ProjetoMDO.administrador', 'MDO.revisar_obra'])"
                v-model="item.revisado"
                type="checkbox"
                class="interruptor"
                :aria-label="`Marcar como revisada a obra ${item.nome}`"
                @click.prevent="marcarComoRevisado(item.id, $event)"
              >
            </td>
            <td
              v-if="temPermissãoPara(['ProjetoMDO.administrador', 'MDO.revisar_obra'])"
            >
              <router-link
                :to="{ name: 'obrasEditar', params: { obraId: item.id } }"
                class="ml1 mr1 tprimary"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>

              <button
                class="ml1 mr1 like-a__text"
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
import { useAuthStore } from '@/stores/auth.store';
import { useObrasStore } from '@/stores/obras.store';
import { storeToRefs } from 'pinia';
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
const { temPermissãoPara } = storeToRefs(authStore);

const obrasStore = useObrasStore();

const {
  ultimoVistoId, lista, chamadasPendentes, erro, paginacao, totalRegistrosRevisados,
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

async function marcarComoRevisado(id, event) {
  // eslint-disable-next-line no-param-reassign
  event.target.ariaBusy = 'true';
  await obrasStore.marcarComoRevisado(id, event.target.checked);
  // eslint-disable-next-line no-param-reassign
  event.target.ariaBusy = 'false';
}

async function marcarTodasComoNaoRevisadas() {
  alertStore.confirmAction(`Deseja marcar ${totalRegistrosRevisados.value} obras como não revisadas?`, async () => {
    if (await obrasStore.marcarTodasComoNaoRevisadas()) {
      obrasStore.buscarTudo();
    }
  }, 'Sim');
}

watchEffect(() => {
  obrasStore.buscarTudo(route.query);
});
</script>
