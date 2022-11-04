<script setup>
    import { useRoute } from 'vue-router';
</script>
<template>
    <div id="submenu">
        <div class="subpadding">
            <h2>Paineis de metas</h2>
            <div class="links-container mb2">
                <router-link to="/paineis">Paineis de metas</router-link>
                <router-link to="/paineis-grupos">Grupos de paineis</router-link>
            </div>
        </div>
    </div>
</template>