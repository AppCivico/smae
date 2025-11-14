<script setup>
import { Field, Form } from 'vee-validate';

import { novaSenha as schema } from '@/consts/formSchemas';
import { useAuthStore } from '@/stores/auth.store';

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
        <Field
          name="password"
          placeholder="*******"
          type="password"
          class="inputtext tc500 mb1"
          :validate-on-input="true"
          :class="{ 'error': errors.password }"
        />
        <div class="error-msg">
          {{ errors.password }}
        </div>
      </div>
      <div class="form-group">
        <label class="label tc300">Repita a Senha</label>
        <Field
          name="passwordConfirmation"
          placeholder="*******"
          type="password"
          class="inputtext tc500 mb1"
          :class="{ 'error': errors.passwordConfirmation }"
        />
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
