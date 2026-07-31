<script setup>
import { onMounted, ref } from 'vue';

import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();

const erro = ref('');

// O token chega no fragmento (`#t=...`) justamente para não ser enviado ao servidor:
// assim ele não entra em log de acesso, em `Referer` nem no log de requisições da API.
function lerTokenDoFragmento() {
  const fragmento = window.location.hash.replace(/^#/, '');

  return new URLSearchParams(fragmento).get('t');
}

onMounted(async () => {
  const token = lerTokenDoFragmento();

  // tira o token da barra de endereços (e do histórico) antes de qualquer outra coisa
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search,
  );

  if (!token) {
    erro.value = 'Token de acesso ausente ou inválido.';
    return;
  }

  try {
    await authStore.loginPorToken(token);

    // recarrega a aplicação inteira para não sobrar nada em memória da sessão anterior
    window.location.assign('/');
  } catch (error) {
    erro.value = error?.message || 'Não foi possível entrar com este token.';
  }
});
</script>

<template>
  <div>
    <h3 class="tc300">
      Entrando no sistema
    </h3>

    <template v-if="erro">
      <p class="tc300 mb2">
        {{ erro }}
      </p>
      <router-link
        to="/login"
        class="btn amarelo block mb2"
      >
        Ir para o login
      </router-link>
    </template>

    <p
      v-else
      class="tc300 mb2"
    >
      <span class="spinner" />
      Validando o token de acesso…
    </p>
  </div>
</template>
