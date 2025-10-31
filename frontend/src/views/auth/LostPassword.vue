<script setup>
import { Field, Form } from 'vee-validate';
import * as Yup from 'yup';

import { useAuthStore } from '@/stores/auth.store';

const schema = Yup.object().shape({
  username: Yup.string().email('E-mail inválido').required('Preencha seu e-mail'),
});

async function onSubmit(values) {
  const authStore = useAuthStore();
  const { username } = values;
  await authStore.passwordRecover(username);
}
</script>

<template>
  <div>
    <router-link
      to="login"
      class="btn round outline tamarelo mb2"
    >
      <svg
        width="8"
        height="13"
        viewBox="0 0 8 13"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M7.20728 2.20732C7.30279 2.11508 7.37897 2.00473 7.43138 1.88273C7.48379 1.76073 7.51137 1.62951 7.51253 1.49673C7.51368 1.36395 7.48838 1.23227 7.4381 1.10937C7.38782 0.986474 7.31356 0.874824 7.21967 0.780931C7.12578 0.687038 7.01412 0.612784 6.89123 0.562503C6.76833 0.512223 6.63665 0.486921 6.50387 0.488075C6.37109 0.489229 6.23987 0.516814 6.11787 0.569223C5.99587 0.621632 5.88552 0.697815 5.79327 0.793325L0.793275 5.79333C0.605804 5.98085 0.500488 6.23516 0.500488 6.50033C0.500488 6.76549 0.605804 7.0198 0.793275 7.20733L5.79327 12.2083C5.98078 12.396 6.23515 12.5014 6.50042 12.5015C6.63177 12.5016 6.76184 12.4757 6.88321 12.4255C7.00458 12.3753 7.11486 12.3017 7.20777 12.2088C7.30068 12.116 7.3744 12.0057 7.42471 11.8844C7.47501 11.7631 7.50093 11.633 7.50098 11.5017C7.50107 11.2364 7.39578 10.982 7.20827 10.7943L2.91428 6.50033L7.20728 2.20732Z"
        />
      </svg>
    </router-link>
    <h3 class="tc300">
      Esqueceu sua senha?
    </h3>
    <p class="tc300 mb2">
      Insira seu email de cadastro e enviaremos um link para você voltar a acessar a sua conta.
    </p>
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      @submit="onSubmit"
    >
      <div class="form-group">
        <label class="label tc300">Login</label>
        <Field
          name="username"
          placeholder="seu_email@provedor.com"
          type="text"
          class="inputtext tc500 mb1"
          :class="{ 'error': errors.username }"
        />
        <div class="error-msg">
          {{ errors.username }}
        </div>
      </div>
      <div class="form-group">
        <button
          class="btn amarelo block mb2"
          :disabled="isSubmitting"
        >
          <span
            v-show="isSubmitting"
            class="spinner"
          />
          Recuperar senha
        </button>
      </div>
    </Form>
  </div>
</template>
