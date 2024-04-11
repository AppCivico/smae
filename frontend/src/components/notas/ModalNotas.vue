<script setup>
import SmallModal from "@/components/SmallModal.vue";
import { storeToRefs } from "pinia";
import { ref } from "vue";

import { useBlocoDeNotasStore } from "@/stores/blocoNotas.store";
const blocoStore = useBlocoDeNotasStore();
const { lista, erro, chamadasPendentes } = storeToRefs(blocoStore);

import { useTipoDeNotasStore } from "@/stores/tipoNotas.store";
const tipoStore = useTipoDeNotasStore();
const { lista: listaTipo, erro: erroTipo } = storeToRefs(tipoStore);

const exibeModalNotas = ref(false);

const props = defineProps({
  blocosToken: {
    type: String,
    default:''
  },
});

function iniciar() {
  blocoStore.buscarTudo('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJibG9jb19pZCI6MSwiYXVkIjoiYm4iLCJpYXQiOjE3MTI3Nzk1NTksImV4cCI6MTcxNTM3MTU1OX0.ryPCczMPVn7aspnBmY8Y4aF1JFi2jV1HjaYUs0ShkJM');
  tipoStore.buscarTudo();
}

iniciar();
</script>

<template>
  <button class="flex center g1 like-a__text" @click="exibeModalNotas = true">
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 0.186053C10.293 0.332053 10.625 0.603053 10.996 0.999053L15.003 5.00505C15.43 5.38505 15.703 5.71705 15.822 6.00205C15.941 6.28705 16 6.62005 16 7.00205V18.0021C16 19.3351 15.333 20.0021 14 20.0021H2.002C0.667 20.0031 0 19.3361 0 18.0021V2.00205C0 0.669053 0.667 0.00205337 2 0.00205337H8.996C9.054 0.00205337 9.56 -0.0329466 10 0.186053ZM2 18.0021H14.001L14 8.00205H10C9.46957 8.00205 8.96086 7.79134 8.58579 7.41627C8.21071 7.04119 8 6.53249 8 6.00205V2.00205H2V18.0021ZM10 3.00205V6.00205H13L10 3.00205ZM5 12.0021C4.333 12.0021 4 11.6691 4 11.0021C4 10.3351 4.334 10.0021 5.001 10.0021H11C11.667 10.0021 12 10.3351 12 11.0021C12 11.6691 11.667 12.0021 11 12.0021H5ZM5 8.00205C4.333 8.00205 4 7.66905 4 7.00205C4 6.33505 4.334 6.00205 5.001 6.00205H6C6.667 6.00205 7 6.33505 7 7.00205C7 7.66905 6.667 8.00205 6 8.00205H5ZM5 16.0021C4.333 16.0021 4 15.6691 4 15.0021C4 14.3351 4.333 14.0021 5 14.0021H11C11.667 14.0021 12 14.3351 12 15.0021C12 15.6691 11.667 16.0021 11 16.0021H5Z"
        fill="#3B5881"
      />
    </svg>
    Notas
  </button>
  <SmallModal v-if="exibeModalNotas">
    <div class="flex spacebetween center mb2">
      <h2>Notas</h2>
      <hr class="ml2 f1" />
      <CheckClose @close="exibeModalNotas = false" />
    </div>

    <div class="mb4"></div>
    <table class="tablemain mb1">
      <col />
      <col />
      <col />
      <col class="col--botão-de-ação" />
      <col class="col--botão-de-ação" />
      <thead>
        <tr>
          <th>Nota</th>
          <th>Status</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, key) in lista" :key="key">
          <td>
            {{ item.nota }}
          </td>
          <td>
            {{ item.status }}
          </td>
          <td>
            {{
              listaTipo.find((tipo) => tipo.id === item.tipo_nota_id)?.codigo
            }}
          </td>
          <td>
            <button class="like-a__text" arial-label="excluir" title="excluir">
              <svg width="20" height="20">
                <use xlink:href="#i_remove" />
              </svg>
            </button>
          </td>
          <td>
            <svg width="20" height="20">
              <use xlink:href="#i_edit" />
            </svg>
          </td>
        </tr>
        <tr v-if="chamadasPendentes.lista">
          <td colspan="10">Carregando</td>
        </tr>
        <tr v-else-if="erro">
          <td colspan="10">Erro: {{ erro }}</td>
        </tr>
        <tr v-else-if="!lista.length">
          <td colspan="10">Nenhum resultado encontrado.</td>
        </tr>
      </tbody>
    </table>
  </SmallModal>
</template>