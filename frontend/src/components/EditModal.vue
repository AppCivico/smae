<script setup>
import { storeToRefs } from 'pinia';

import { useEditModalStore } from '@/stores';

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
            <div class="flex spacebetween center mb2">
                <div class="t36 w900">{{editModal.title}}</div>
                <hr class="ml2 f1"/>
                <button @click="editModalStore.clear()" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
            </div>
            <div>
                {{editModal.content}}
            </div>
        </div>
    </div>
</template>