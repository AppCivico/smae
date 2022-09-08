<script setup>
import { storeToRefs } from 'pinia';

import { useEditModalStore, useAlertStore } from '@/stores';

const alertStore = useAlertStore();
const editModalStore = useEditModalStore();
const { editModal } = storeToRefs(editModalStore);
async function callbackFn(){
    await editModal.value.callback();
    editModalStore.clear();
}
</script>

<template>
    <div v-if="editModal" class="editModal-wrap">
        <div class="overlay" @click="editModalStore.clear()"></div>
        <div class="editModal" :class="editModal.classes">
            <div>
                <editModal.content :props="editModal.props" />
            </div>
        </div>
    </div>
</template>