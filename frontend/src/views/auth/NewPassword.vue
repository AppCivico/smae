<script setup>
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';

import { useAuthStore } from '@/stores';

const schema = Yup.object().shape({
    password: Yup.string().required('Preencha sua nova senha').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,'Deve conter pelo menos: um número, um caractere maiúsculo e um caractere especial'),
    passwordConfirmation: Yup.string().required('Repita sua senha')
         .oneOf([Yup.ref('password'), null], 'Senhas não coincidem')

});

async function onSubmit(values) {
    const authStore = useAuthStore();
    const { password } = values;
    await authStore.passwordRebuilt(password);
}
</script>

<template>
    <div class="login">
        <div class="login-form">
            <div class="wrap flex column spacebetween">
                <div>
                    <img src="@/assets/logo.svg" alt="SMAE">
                    <p class="tamarelo">Sistema de Monitoramento e Acompanhamento Estratégico</p>
                </div>
                <div>
                    <h3 class="tc300">Senha temporária</h3>
                    <p class="tc300 mb2">Sua conta foi recuperada com sucesso. Agora redefina sua senha.</p>
                    <Form @submit="onSubmit" :validation-schema="schema" v-slot="{ errors, isSubmitting }">
                        <div class="form-group">
                            <label class="label tc300">Nova Senha</label>
                            <Field name="password" placeholder="*******" type="password" class="inputtext tc500 mb1" :class="{ 'error': errors.password }" />
                            <div class="error-msg">{{ errors.password }}</div>
                        </div>
                        <div class="form-group">
                            <label class="label tc300">Repita a Senha</label>
                            <Field name="passwordConfirmation" placeholder="*******" type="password" class="inputtext tc500 mb1" :class="{ 'error': errors.passwordConfirmation }" />
                            <div class="error-msg">{{ errors.passwordConfirmation }}</div>
                        </div>
                        <div class="form-group">
                            <button class="btn amarelo block mb2" :disabled="isSubmitting">
                                <span v-show="isSubmitting" class="spinner"></span>
                                Salvar nova senha
                            </button>
                        </div>
                    </Form>
                </div>
                <div class="flex">
                    <img src="@/assets/sp.svg" class="mr2">
                    <img src="@/assets/fgv.svg">
                </div>
            </div>
        </div>
    </div>
</template>