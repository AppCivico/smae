<script setup>
import { ref, unref } from 'vue';
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useAuthStore, useMetasStore, useIndicadoresStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const meta_id = route.params.meta_id;
const id = route.params.indicador_id;

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);
MetasStore.getById(meta_id);

const IndicadoresStore = useIndicadoresStore();
const { tempIndicadores } = storeToRefs(IndicadoresStore);

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

let title = 'Adicionar Indicador';
if (id) {
    title = 'Editar Indicador';
    IndicadoresStore.getById(id);
    console.log(singleMeta.value.id,tempIndicadores.meta_id);
}

const schema = Yup.object().shape({
    /*"polaridade": "Neutra",
    "periodicidade": "Diario",
    "codigo": "string",
    "titulo": "string",
    "agregador_id": 1,
    "janela_agregador": 1,
    "regionalizavel": true,
    "inicio_medicao": "YYYY-MM-DD",
    "fim_medicao": "YYYY-MM-DD",
    "meta_id": 1*/
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (id&&tempIndicadores.value.id) {
            r = await IndicadoresStore.update(tempIndicadores.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await IndicadoresStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            MetasStore.clear();
            await router.push('/metas/'+meta_id);
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/metas/'+meta_id);
}
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <div class="t24 mb2">Meta {{singleMeta.codigo}} {{singleMeta.titulo}}</div>

        <template v-if="!(tempIndicadores?.loading || tempIndicadores?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="tempIndicadores" v-slot="{ errors, isSubmitting }">

                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Código <span class="tvermelho">*</span></label>
                        <Field name="codigo" type="text" class="inputtext light mb1" :class="{ 'error': errors.codigo }" />
                        <div class="error-msg">{{ errors.codigo }}</div>
                    </div>
                    <div class="f2">
                        <label class="label">Título <span class="tvermelho">*</span></label>
                        <Field name="titulo" type="text" class="inputtext light mb1" :class="{ 'error': errors.titulo }" />
                        <div class="error-msg">{{ errors.titulo }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Polaridade <span class="tvermelho">*</span></label>
                        <Field name="polaridade" as="select" class="inputtext light mb1" :class="{ 'error': errors.polaridade }">
                            <option value="">Selecionar</option>
                            <option value="Neutra">Neutra</option>
                            <option value="Positiva">Positiva</option>
                            <option value="Negativa">Negativa</option>
                        </Field>
                        <div class="error-msg">{{ errors.polaridade }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Periodicidade <span class="tvermelho">*</span></label>
                        <Field name="periodicidade" as="select" class="inputtext light mb1" :class="{ 'error': errors.periodicidade }">
                            <option value="Diario">Diario</option>
                            <option value="Semanal">Semanal</option>
                            <option value="Mensal">Mensal</option>
                            <option value="Bimestral">Bimestral</option>
                            <option value="Trimestral">Trimestral</option>
                            <option value="Quadrimestral">Quadrimestral</option>
                            <option value="Semestral">Semestral</option>
                            <option value="Anual">Anual</option>
                            <option value="Quinquenal">Quinquenal</option>
                            <option value="Secular">Secular</option>
                        </Field>
                        <div class="error-msg">{{ errors.periodicidade }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Início da Medição <span class="tvermelho">*</span></label>
                        <Field name="inicio_medicao" type="text" class="inputtext light mb1" :class="{ 'error': errors.inicio_medicao }" maxlength="10" @keyup="maskDate" />
                        <div class="error-msg">{{ errors.inicio_medicao }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Fim da Medição <span class="tvermelho">*</span></label>
                        <Field name="fim_medicao" type="text" class="inputtext light mb1" :class="{ 'error': errors.fim_medicao }" maxlength="10" @keyup="maskDate" />
                        <div class="error-msg">{{ errors.fim_medicao }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Agregador <span class="tvermelho">*</span></label>
                        <Field name="agregador_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.agregador_id }">
                            <option value="">Selecionar</option>
                            <option value="Neutra">Neutra</option>
                            <option value="Positiva">Positiva</option>
                            <option value="Negativa">Negativa</option>
                        </Field>
                        <div class="error-msg">{{ errors.agregador_id }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Janela (ciclos) <span class="tvermelho">*</span></label>
                        <Field name="janela_agregador" type="text" class="inputtext light mb1" :class="{ 'error': errors.janela_agregador }" />
                        <div class="error-msg">{{ errors.janela_agregador }}</div>
                    </div>
                </div>

                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        
        <template v-if="tempIndicadores?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="tempIndicadores?.error||error">
            <div class="error p1">
                <div class="error-msg">{{tempIndicadores.error??error}}</div>
            </div>
        </template>
    </Dashboard>
</template>
