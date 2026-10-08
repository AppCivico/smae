<script setup>
import { Field, Form } from 'vee-validate';
import { ref } from 'vue';

import { novaSenha as schema } from '@/consts/formSchemas';
import { useAuthStore } from '@/stores/auth.store';

const mostrarSenha = ref(false);

async function onSubmit(values) {
  const authStore = useAuthStore();
  const { password } = values;
  await authStore.passwordRebuilt(password);
}
</script>

<template>
  <div>
    <h3 class="tc300">
      Senha temporária
    </h3>
    <p class="tc300 mb2">
      Sua conta foi recuperada com sucesso. Agora redefina sua senha.
    </p>
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      @submit="onSubmit"
    >
      <div class="form-group">
        <label class="label tc300">Nova Senha</label>
        <div class="password-field">
          <Field
            name="password"
            :placeholder="mostrarSenha ? 'senha' : '*******'"
            :type="mostrarSenha ? 'text' : 'password'"
            class="inputtext tc500 mb1 password-field__input"
            :validate-on-input="true"
            :class="{ 'error': errors.password }"
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
            >
              <use :xlink:href="mostrarSenha ? '#i_eye-white-off' : '#i_eye-white'" />
            </svg>
          </button>
        </div>
        <div class="error-msg">
          {{ errors.password }}
        </div>
      </div>
      <div class="form-group">
        <label class="label tc300">Repita a Senha</label>
        <div class="password-field">
          <Field
            name="passwordConfirmation"
            :placeholder="mostrarSenha ? 'senha' : '*******'"
            :type="mostrarSenha ? 'text' : 'password'"
            class="inputtext tc500 mb1 password-field__input"
            :class="{ 'error': errors.passwordConfirmation }"
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
            >
              <use :xlink:href="mostrarSenha ? '#i_eye-white-off' : '#i_eye-white'" />
            </svg>
          </button>
        </div>
        <div class="error-msg">
          {{ errors.passwordConfirmation }}
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
          Salvar nova senha
        </button>
      </div>
    </Form>
  </div>
</template>

<style lang="less" scoped>
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
