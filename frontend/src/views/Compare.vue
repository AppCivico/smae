<script setup>
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore } from '@/stores';
import { default as EvolucaoGraphComparison } from '@/components/EvolucaoGraphComparison.vue';
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>

<template>
    <Dashboard>
        <div>
            <EvolucaoGraphComparison />
        </div>
    </Dashboard>
</template>