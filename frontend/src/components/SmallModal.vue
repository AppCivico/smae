<script setup>
import { ref, computed } from 'vue'

const props = defineProps(['active','classes']);
let active = computed(()=>props.active);
</script>

<template>
    <div class="editModal-wrap" :style="{display: active?'':'none'}">
        <div class="overlay" @click="$emit('close')"></div>
        <div class="editModal small" :class="props.classes">
            <slot />
        </div>
    </div>
</template>