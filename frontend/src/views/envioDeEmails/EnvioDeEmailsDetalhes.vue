<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import TextEditor from '@/components/camposDeFormulario/TextEditor/index.ts';
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

envioDeEmailsStore.buscarTudo({ pagina: 1 });

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

  <LoadingComponent v-if="chamadasPendentes.lista" />

  <form
    v-else
    class="mt2"
    @submit.prevent="handleEnviar"
  >
    <div class="mb2">
      <SmaeLabel for="assunto">
        Assunto
      </SmaeLabel>
      <input
        id="assunto"
        v-model="assunto"
        class="inputtext light big"
        type="text"
      >
    </div>

    <div class="corpo-email mb2">
      <SmaeLabel for="corpo">
        Conteúdo
      </SmaeLabel>
      <TextEditor
        v-model="corpo"
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

<style scoped>
.corpo-email :deep(.ProseMirror) {
  min-height: 30em;
}
</style>
