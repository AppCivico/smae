<script setup>
import { Dashboard } from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useUsersStore, useAlertStore, useOrgansStore } from '@/stores';

const usersStore = useUsersStore();
usersStore.clear();
const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

const organsStore = useOrgansStore();
const { organs } = storeToRefs(organsStore);
organsStore.getAll();

let title = 'Cadastro de Usuário';
const { user, accessProfiles } = storeToRefs(usersStore);
usersStore.getProfiles();
if (id) {
    title = 'Editar Usuário';
    usersStore.getById(id);
}

const schema = Yup.object().shape({
    email: Yup.string().required('Preencha o e-mail').email('E-mail inválido'),
    nome_completo: Yup.string().required('Preencha o nome'),
    nome_exibicao: Yup.string().required('Preencha o nome social').max(20,'Máximo de 20 caracteres'),
    lotacao: Yup.string().required('Preencha a lotação'),
    orgao_id: Yup.number().required('Selecione um órgão'),
    perfil_acesso_ids: Yup.array().required('Selecione ao menos uma permissão'),
    motivo: Yup.string().when("ativo", {is: true, then: Yup.string().required("Escreva um motivo para a inativação")})
});

async function onSubmit(values) {
    try {
        let msg;
        if (id&&user) {
            await usersStore.update(user.value.id, values)
            msg = 'Dados salvos com sucesso!';
        } else {
            await usersStore.register(values);
            msg = 'Usuário adicionado com sucesso!';
        }
        await router.push('/usuarios');
        alertStore.success(msg);
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/usuarios');
}
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="!(user?.loading || user?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="user" v-slot="{ errors, isSubmitting }">

                <div class="flex g2 mb2" v-if="user&&id">
                    <div class="">
                        <label class="block mb1">
                            <Field name="ativo" class="inputcheckbox" type="checkbox" :value="true"/><span>Inativar cadastro</span>
                        </label>
                    </div>
                    <div class="f1">
                        <label class="label">Motivo <span class="tvermelho">*</span></label>
                        <Field name="motivo" type="text" class="inputtext light mb1" :class="{ 'error': errors.motivo }" />
                        <div class="error-msg">{{ errors.motivo }}</div>
                    </div>
                </div>

                <div class="flex g2">
                    <div class="f1">
                        <label class="label">E-mail <span class="tvermelho">*</span></label>
                        <Field name="email" type="text" class="inputtext light mb1" :class="{ 'error': errors.email }" />
                        <div class="error-msg">{{ errors.email }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Nome Completo <span class="tvermelho">*</span></label>
                        <Field name="nome_completo" type="text" class="inputtext light mb1" :class="{ 'error': errors.nome_completo }" />
                        <div class="error-msg">{{ errors.nome_completo }}</div>
                    </div>
                </div>

                <div class="flex g2 mb2">
                    <div class="f1">
                        <label class="label">Nome Social <span class="tvermelho">*</span></label>
                        <Field name="nome_exibicao" type="text" class="inputtext light mb1" :class="{ 'error': errors.nome_exibicao }" />
                        <div class="error-msg">{{ errors.nome_exibicao }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Lotação <span class="tvermelho">*</span></label>
                        <Field name="lotacao" type="text" class="inputtext light mb1" :class="{ 'error': errors.lotacao }" />
                        <div class="error-msg">{{ errors.lotacao }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Órgão <span class="tvermelho">*</span></label>
                        <Field name="orgao_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.orgao_id }">
                            <option value="1">Nenhum</option>
                            <template v-if="organs.length">
                                <option v-for="organ in organs" :key="organ.id" :value="organ.id">{{ organ.sigla }}</option>
                            </template>
                        </Field>
                        <div class="error-msg">{{ errors.orgao_id }}</div>
                    </div>
                </div>

                <div class="mb2">
                    <div class="label">Permissões</div>
                    <label v-for="profile in accessProfiles" :key="profile.id" class="block mb1">
                        <Field name="perfil_acesso_ids" class="inputcheckbox" type="checkbox" :value="profile.id" /><span>{{profile.nome}} <span class="qtipitem">i <div class="qtip">
                            <p class="label">Privilegios</p>
                            <ul>
                                <li v-for="privilegio in profile.perfil_privilegio" :key="privilegio.privilegio.nome">{{privilegio.privilegio.nome}}</li>
                            </ul>
                        </div></span></span>
                    </label>
                    <div class="error-msg">{{ errors.perfil_acesso_ids }}</div>
                </div>

                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar cadastro</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        <template v-if="user?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="user?.error">
            <div class="error p1">
                <div class="error-msg">{{user.error}}</div>
            </div>
        </template>
    </Dashboard>
</template>
