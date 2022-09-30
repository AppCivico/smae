<script setup>
import { storeToRefs } from 'pinia';
import { router } from '@/router';
import { useEditModalStore, useAlertStore } from '@/stores';

const alertStore = useAlertStore();
const editModalStore = useEditModalStore();
const { editModal } = storeToRefs(editModalStore);
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ 
        router.go(-1);
        editModalStore.clear(); 
        alertStore.clear(); 
    });
}
</script>

<template>
    <div v-if="editModal" class="editModal-wrap">
        <div class="overlay" @click="checkClose"></div>
        <div class="editModal" :class="editModal.classes">
            <div>
                <editModal.content :props="editModal.props" />
            </div>
        </div>
    </div>
</template>