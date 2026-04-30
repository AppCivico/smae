<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAlertStore } from '@/stores/alert.store';
import { useEnvioDeEmailsStore } from '@/stores/envioDeEmails.store';

const router = useRouter();
const alertStore = useAlertStore();
const envioDeEmailsStore = useEnvioDeEmailsStore();
const { assuntoUltimoEmail, corpoUltimoEmail, chamadasPendentes } = storeToRefs(envioDeEmailsStore);

const preenchido = ref(false);
const assunto = ref('');
const corpo = ref('');

watch(
  [assuntoUltimoEmail, corpoUltimoEmail],
  ([novoAssunto, novoCorpo]) => {
    if (!preenchido.value) {
      assunto.value = novoAssunto;
      corpo.value = novoCorpo;
      if (novoAssunto || novoCorpo) {
        preenchido.value = true;
      }
    }
  },
  { immediate: true },
);

if (!envioDeEmailsStore.lista.length) {
  envioDeEmailsStore.buscarTudo({ pagina: 1 });
}

function handleEnviar() {
  alertStore.confirmAction('Deseja enviar o e-mail para os parlamentares?', async () => {
    const ok = await envioDeEmailsStore.dispararEmail(assunto.value, corpo.value);
    if (ok) {
      router.push({ name: 'envioDeEmails.listar' });
    }
  });
}
</script>

<template>
  <CabecalhoDePagina />

  <form
    class="mt2"
    @submit.prevent="handleEnviar"
  >
    <div class="mb2">
      <SmaeLabel
        for="assunto"
        label="Assunto"
      />
      <input
        id="assunto"
        v-model="assunto"
        class="inputtext light big"
        type="text"
      >
    </div>

    <div class="mb2">
      <SmaeLabel
        for="corpo"
        label="Conteúdo"
      />
      <textarea
        id="corpo"
        v-model="corpo"
        class="inputtext light big"
        rows="20"
      />
    </div>

    <SmaeFieldsetSubmit
      :disabled="chamadasPendentes.disparar"
    >
      <button
        class="btn big"
        type="submit"
      >
        Enviar
      </button>
    </SmaeFieldsetSubmit>
  </form>
</template>
