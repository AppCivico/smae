<script setup>
    import { useRoute } from 'vue-router';
</script>
<template>
    <div id="submenu">
        <div class="subpadding">
            <h2>Ciclo vigente</h2>
            <div class="links-container mb2">

                <router-link to="/monitoramento/metas">Metas por fase do ciclo</router-link>
                <router-link class="disabled" to="/monitoramento/">Coleta - Evolução</router-link>
                <router-link class="disabled" to="/monitoramento/">Coleta - Cronograma</router-link>
                <router-link class="disabled" to="/monitoramento/">Qualificação</router-link>
                <router-link class="disabled" to="/monitoramento/">Análise de risco</router-link>
                <router-link class="disabled" to="/monitoramento/">Fechamento</router-link>
            </div>
            <h2>Configuração</h2>
            <div class="links-container mb2">
                <router-link to="/monitoramento/ciclos">Próximos ciclos</router-link>
                <router-link to="/monitoramento/ciclos/fechados">Ciclos fechados</router-link>
            </div>
            
        </div>
    </div>
</template>