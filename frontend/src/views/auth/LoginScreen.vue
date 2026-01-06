<script setup>
import { Field, Form } from 'vee-validate';
import { ref } from 'vue';

import { autenticação as schema } from '@/consts/formSchemas';
import { useAuthStore } from '@/stores/auth.store';

const mostrarSenha = ref(false);

async function onSubmit(values) {
  const authStore = useAuthStore();
  await authStore.login(values);
}
</script>
<template>
  <Form
    v-slot="{ errors, isSubmitting, setFieldValue }"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="form-group">
      <label class="label tc300">Login</label>
      <Field
        name="email"
        placeholder="seu_email@provedor.com"
        type="text"
        class="inputtext tc500 mb1"
        :class="{ 'error': errors.email }"
        @change="($e) => { setFieldValue('email', $e.target.value.trim()); }"
      />
      <div class="error-msg">
        {{ errors.email }}
      </div>
    </div>
    <div class="form-group">
      <label class="label tc300">Senha</label>
      <div class="password-field">
        <Field
          name="senha"
          :placeholder="mostrarSenha ? 'senha' : '*******'"
          :type="mostrarSenha ? 'text' : 'password'"
          class="inputtext tc500 mb1 password-field__input"
          :class="{ 'error': errors.senha }"
          @change="($e) => { setFieldValue('senha', $e.target.value.trim()); }"
        />
        <button
          type="button"
          class="password-field__toggle"
          :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
          @click="mostrarSenha = !mostrarSenha"
        >
          <svg
            class="password-field__icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              v-if="!mostrarSenha"
              d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            />
            <circle
              v-if="!mostrarSenha"
              cx="12"
              cy="12"
              r="3"
            />
            <path
              v-if="mostrarSenha"
              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9
                 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3
                 0 1 1-4.24-4.24"
            />
            <line
              v-if="mostrarSenha"
              x1="1"
              y1="1"
              x2="23"
              y2="23"
            />
          </svg>
        </button>
      </div>
      <div class="error-msg">
        {{ errors.senha }}
      </div>
    </div>
    <div class="form-group">
      <router-link
        to="/esqueci-minha-senha"
        class="link tamarelo w700 mb2 block"
      >
        Esqueci minha senha
      </router-link>
      <button
        class="btn amarelo block mb2"
        :disabled="isSubmitting"
      >
        <span
          v-show="isSubmitting"
          class="spinner"
        />
        Acessar sistema
      </button>
    </div>
  </Form>
</template>
<style lang="less" scoped>
form {
  input:-webkit-autofill {
    background-color: inherit !important;
    -webkit-text-fill-color: inherit !important;
  }
}

.password-field {
  position: relative;

  // Prevenir o ícone de "mostrar senha" no input de senha do Edge
  input[type="password"]::-ms-reveal {
    display: none;
  }
}

.password-field__input {
  padding-right: 40px;
}

.password-field__toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
}

.password-field__icon {
  display: block;
}
</style>
