<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import LocalFilter from '@/components/LocalFilter.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { liçãoAprendida as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';

const licoesaprendidasStore = useLiçõesAprendidasStore();
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(licoesaprendidasStore);

const projetosStore = useProjetosStore();
const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);

const route = useRoute();
const projetoId = route?.params?.projetoId;

const listaFiltradaPorTermoDeBusca = ref([]);
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  licoesaprendidasStore.$reset();

  await licoesaprendidasStore.buscarTudo();
}

function deletarItem({ id }) {

}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? listaFiltradaPorTermoDeBusca.value
  : listaFiltradaPorTermoDeBusca.value
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_licoesaprendida === statusVisível.value))
));

iniciar();
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Lições Aprendidas
    </TítuloDePágina>

    <hr class="ml2 f1">

    <div
      v-if="!permissõesDoProjetoEmFoco.apenas_leitura
        || permissõesDoProjetoEmFoco.sou_responsavel"
      class="ml2"
    >
      <router-link
        :to="{ name: 'liçõesAprendidasCriar' }"
        class="btn"
      >
        Nova lição aprendida
      </router-link>
    </div>
  </div>

  <div class="flex center mb1 spacebetween">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
      class="f1"
    />
  </div>

  <SmaeTable
    :dados="listaFiltrada"
    :schema="schema"
    :colunas="[
      { chave: 'data_registro' },
      { chave: 'contexto', ehCabecalho: true },
      { chave: 'responsavel' },
      { chave: 'observacao' },
    ]"
    :rota-editar="(linha) => ({
      name: 'liçõesAprendidasEditar',
      params: {
        projetoId: projetoId,
        licaoAprendidaId: linha.id,
      }
    })"
    @deletar="deletarItem"
  >
    <template #celula:data_registro="{ linha }">
      <SmaeLink
        :to="{
          name: 'liçõesAprendidasResumo',
          params: {
            projetoId: projetoId,
            licaoAprendidaId: linha.id,
          }
        }"
      >
        {{ linha.sequencial }} {{ dateToField(linha.data_registro) }}
      </SmaeLink>
    </template>

    <template #celula:contexto="{ linha }">
      <SmaeLink
        :to="{
          name: 'liçõesAprendidasResumo',
          params: {
            projetoId: projetoId,
            licaoAprendidaId: linha.id,
          }
        }"
      >
        {{ linha.contexto }}
      </SmaeLink>
    </template>
  </SmaeTable>

  <table
    v-if="listaFiltrada.length"
    class="tabela-de-etapas"
  >
    <colgroup>
      <col class="col--minimum">
      <col class="col--data">
      <col>
      <col>
      <col>
      <col
        v-if="!permissõesDoProjetoEmFoco.apenas_leitura
          || permissõesDoProjetoEmFoco.sou_responsavel"
        class="col--botão-de-ação"
      >
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th />
        <th class="tl">
          {{ schema.fields['data_registro'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['contexto'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['responsavel'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['observacao'].spec.label }}
        </th>
        <th
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
        />
      </tr>
    </thead>

    <tbody
      v-for="linha in listaFiltrada"
      :key="linha.id"
      class="tablemain"
    >
      <tr>
        <td
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
          class="center"
        >
          <router-link
            :to="{
              name: 'liçõesAprendidasEditar',
              params: {
                projetoId: projetoId,
                licaoAprendidaId: linha.id,
              }
            }"
            title="Editar licoesaprendida"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
      </tr>
    </tbody>
  </table>

  <span
    v-if="chamadasPendentes?.lista"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
