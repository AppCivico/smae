<script setup>
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore } from '@/stores';
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

import { useEditModalStore } from '@/stores';

const editModalStore = useEditModalStore();
//editModalStore.modal('Carregar arquivo','OI','tamarelo');
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center">
            <h1>Olá, {{user.nome_exibicao}}</h1>
        </div>
    </Dashboard>
</template>