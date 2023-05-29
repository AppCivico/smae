<script setup>
import { useProjetosStore } from '@/stores';
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const projetosStore = useProjetosStore();
const {
  chamadasPendentes, emFoco, permissões,
} = storeToRefs(projetosStore);

const ações = [
  {
    ação: 'arquivar',
    nome: 'Arquivar',
  },
  {
    ação: 'restaurar',
    nome: 'Restaurar',
  },
  {
    ação: 'selecionar',
    nome: 'Selecionar',
  },
  {
    ação: 'finalizar_planejamento',
    nome: 'Finalizar planejamento',
  },
  {
    ação: 'validar',
    nome: 'Validar',
  },
  {
    ação: 'iniciar',
    nome: 'Iniciar',
  },
  {
    ação: 'suspender',
    nome: 'Suspender',
  },
  {
    ação: 'reiniciar',
    nome: 'Reiniciar',
  },
  {
    ação: 'iniciar_planejamento',
    nome: 'Iniciar Planejamento',
  },
  {
    ação: 'cancelar',
    nome: 'Cancelar',
  },
  {
    ação: 'terminar',
    nome: 'Terminar',
  },
];

const açõesPermitidas = computed(() => ações.filter((x) => !!permissões?.value?.[`acao_${x.ação}`]));

async function mudarStatus(id, { nome, ação }) {
  useAlertStore()
    .confirmAction(`Deseja mesmo mudar o status para ${nome}?`, async () => {
      const resposta = await projetosStore.mudarStatus(id, ação);
      if (resposta) {
        projetosStore.buscarItem(id);
      }
    });
}
</script>
<template>
  <div
    v-if="açõesPermitidas.length"
    class="ml2 dropbtn"
  >
    <span class="btn">Mudar status</span>
    <ul>
      <li
        v-for="item, k in açõesPermitidas"
        :key="k"
      >
        <button
          type="button"
          class="like-a__link"
          :disabled="chamadasPendentes.mudarStatus"
          @click="mudarStatus(emFoco.id, item)"
        >
          {{ item.nome }}
        </button>
      </li>
    </ul>
  </div>
</template>
