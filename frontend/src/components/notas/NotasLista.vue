<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTipoDeNotasStore } from '@/stores/tipoNotas.store';
import { useUsersStore } from '@/stores/users.store';
import { storeToRefs } from 'pinia';

import { ref, watch } from 'vue';

const ÓrgãosStore = useOrgansStore();

const UserStore = useUsersStore();

const status = {
  Programado: {
    value: 'Programado',
    text: 'Programado',
  },
  Em_Curso: {
    value: 'Em_Curso',
    text: 'Em curso',
  },
  Suspenso: {
    value: 'Suspenso',
    text: 'Suspenso',
  },
  Cancelado: {
    value: 'Cancelado',
    text: 'Cancelado',
  },
};

const blocoStore = useBlocoDeNotasStore();
const {
  lista: listaNotas,
  erro,
  chamadasPendentes,
} = storeToRefs(blocoStore);

const tipoStore = useTipoDeNotasStore();
const { lista: listaTipo } = storeToRefs(tipoStore);

const exibeModalNotas = ref(false);
const exibeForm = ref(false);
const statusSelecionado = ref('');

const props = defineProps({
  blocosToken: {
    type: String,
    required: true,
  },
});

async function excluirNota(id) {
  useAlertStore().confirmAction(
    'Deseja mesmo remover a nota?',
    async () => {
      if (await blocoStore.excluirItem(id)) {
        blocoStore.$reset();
        blocoStore.buscarTudo(props.blocosToken);
        useAlertStore().success('Nota removida.');
      }
    },
    'Remover',
  );
}

function editarNota(id) {
  exibeForm.value = true;
  blocoStore.buscarItem(id);
}

watch(
  () => props.blocosToken,
  () => {
    if (props.blocosToken) {
      blocoStore.buscarTudo(props.blocosToken);
    }
  },
  { immediate: true },
);

watch(statusSelecionado, (novoValor) => {
  blocoStore.buscarTudo(props.blocosToken, { status: novoValor });
});

tipoStore.buscarTudo();
ÓrgãosStore.getAll();

// PRA-FAZER: Buscar só na primeira abertura do formulário
ÓrgãosStore.getAll();
UserStore.buscarPessoasSimplificadas();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h2>Notas</h2>
    <hr class="ml2 f1">
  </div>

  <table class="tablemain mb1">
    <col>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>Nota</th>
        <th>Status</th>
        <th>Tipo</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, key) in listaNotas"
        :key="key"
      >
        <td>
          {{ item.nota }}
        </td>
        <td class="cell--nowrap">
          {{ status[item.status]?.text || item.status }}
        </td>
        <td>
          {{ listaTipo.find((tipo) => tipo.id === item.tipo_nota_id)?.codigo }}
        </td>
        <td>
          <button
            class="like-a__text"
            arial-label="Excluir"
            title="Excluir"
            @click="excluirNota(item.id_jwt)"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_remove" />
            </svg>
          </button>
        </td>
        <td>
          <button
            arial-label="Editar"
            title="Editar"
            class="like-a__text"
            @click="editarNota(item.id_jwt)"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_edit" />
            </svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.listaNotas">
        <td colspan="10">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="10">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!listaNotas.length">
        <td colspan="10">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
