<script setup>
import {
  ref, reactive, onMounted, onUpdated,
} from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useRoute } from 'vue-router';
import { default as AddEditCiclo } from '@/views/monitoramento/AddEditCiclo.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useCiclosStore } from '@/stores/ciclos.store';
import { useEditModalStore } from '@/stores/editModal.store';

const route = useRoute();
const { ciclo_id } = route.params;
const editModalStore = useEditModalStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const CiclosStore = useCiclosStore();
const { Ciclos } = storeToRefs(CiclosStore);
CiclosStore.getCiclos();

function start() {
  if (ciclo_id) editModalStore.modal(AddEditCiclo);
}
onMounted(() => { start(); });
onUpdated(() => { start(); });

function dateToField(d) {
  const dd = d ? new Date(d) : false;
  return (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }) : '';
}
function dateToTitle(d) {
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const month = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][dd.getUTCMonth()];
  const year = dd.getUTCFullYear();
  return `${month} ${year}`;
}
</script>
<template>
  <Dashboard>
    <MigalhasDePão class="mb1" />

    <div class="flex spacebetween center mb2">
      <h1>Próximos Ciclos</h1>
      <hr class="ml2 f1">
    </div>

    <table class="tablemain fix">
      <thead>
        <tr>
          <th>Mês/Ano</th>
          <th>Início coleta</th>
          <th>Início qualificação</th>
          <th>Início análise de risco</th>
          <th>Início Fechamento</th>
          <th>Fechamento</th>
          <th>Status</th>
          <th
            v-if="perm?.CadastroPdm?.editar"
            style="width: 50px;"
          />
        </tr>
      </thead>
      <tbody>
        <template v-if="!Ciclos.loading && Ciclos?.length">
          <tr
            v-for="c in Ciclos.filter(x => x.ativo || x.data_ciclo > new Date().toISOString())"
            :key="c.id"
          >
            <td>{{ dateToTitle(c.data_ciclo) }}</td>
            <td>{{ c.inicio_coleta }}</td>
            <td>{{ c.inicio_qualificacao }}</td>
            <td>{{ c.inicio_analise_risco }}</td>
            <td>{{ c.inicio_fechamento }}</td>
            <td>{{ c.fechamento }}</td>
            <td>{{ c.ativo ? 'Ativo' : 'Inativo' }}</td>
            <td
              v-if="perm?.CadastroPdm?.editar"
              style="white-space: nowrap; text-align: right"
            >
              <router-link
                v-if="c.pode_editar"
                :to="`/monitoramento/ciclos/${c.id}`"
                class="tprimary"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>
            </td>
          </tr>
        </template>
        <tr v-else-if="Ciclos.loading">
          <td colspan="8">
            Carregando
          </td>
        </tr>
        <tr v-else-if="Ciclos.error">
          <td colspan="8">
            Error: {{ Ciclos.error }}
          </td>
        </tr>
        <tr v-else>
          <td colspan="8">
            Nenhum resultado encontrado.
          </td>
        </tr>
      </tbody>
    </table>
  </Dashboard>
</template>
