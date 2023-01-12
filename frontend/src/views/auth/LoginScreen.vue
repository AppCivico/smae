<script setup>
import { Field, Form } from 'vee-validate';
import * as Yup from 'yup';

import { useAuthStore } from '@/stores';

const schema = Yup.object().shape({
  username: Yup.string().required('Preencha seu usuário'),
  password: Yup.string().required('Preencha sua senha'),
});

async function onSubmit(values) {
  const authStore = useAuthStore();
  const { username, password } = values;
  await authStore.login(username, password);
}
</script>

<template>
  <div class="login">
    <div class="login-form">
      <div class="wrap flex column spacebetween">
        <div>
          <img
            src="@/assets/logo.svg"
            alt="SMAE"
          >
          <p class="tamarelo">
            Sistema de Monitoramento e Acompanhamento Estratégico
          </p>
        </div>
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
            <label class="label tc300">Senha</label>
            <Field
              name="password"
              placeholder="*******"
              type="password"
              class="inputtext tc500 mb1"
              :class="{ 'error': errors.password }"
            />
            <div class="error-msg">
              {{ errors.password }}
            </div>
          </div>
          <div class="form-group">
            <router-link
              to="esqueci-minha-senha"
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
        <div class="flex">
          <img
            src="@/assets/sp.svg"
            class="mr2"
          >
          <img src="@/assets/fgv.svg">
        </div>
      </div>
    </div>
  </div>
</template>
