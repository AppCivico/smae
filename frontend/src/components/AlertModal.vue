<script setup>
import { storeToRefs } from 'pinia';

import { useAlertStore } from '@/stores';

const alertStore = useAlertStore();
const { alert } = storeToRefs(alertStore);
async function callbackFn(){
    await alert.value.callback();
    alertStore.clear();
}
</script>

<template>
    <div v-if="alert" class="alert-wrap">
        <div class="overlay" @click="alertStore.clear()"></div>
        <div class="alert" :class="alert.type">
            <div class="mr2" v-html="alert.message"></div>
            <template v-if="alert.type=='confirmAction'">
                <button @click="callbackFn" class="btn amarelo mr1">{{alert.label}}</button>
                <button @click="alert.fallback?alert.fallback():alertStore.clear()" class="btn outline bgnone tcamarelo">Cancelar</button>
            </template>
            <template v-else-if="alert.type=='confirm'">
                <router-link v-if="typeof alert.url == 'string'" :to="alert.url" class="btn amarelo mr1" @click="alertStore.clear()">Sair sem salvar</router-link>
                <button v-if="typeof alert.url != 'string'" @click="alert.url" class="btn amarelo mr1">Sair sem salvar</button>
                <button @click="alertStore.clear()" class="btn amarelo outline">Cancelar</button>
            </template>
            <template v-else>
                <button @click="alertStore.clear()" class="btn amarelo">OK</button>
            </template>
        </div>
    </div>
</template>