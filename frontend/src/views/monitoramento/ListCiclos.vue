<script setup>
    import { ref, reactive } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Dashboard} from '@/components';
    import { useAuthStore } from '@/stores';

    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;
</script>
<template>
    <Dashboard>
        <div class="breadcrumbinline">
            <router-link to="/monitoramento">Monitoramento</router-link>
            <router-link to="/monitoramento/ciclos">Coleta de dados</router-link>
        </div>
        <div class="flex spacebetween center mb2">
            <h1>Próximos Ciclos</h1>
            <hr class="ml2 f1" />
        </div>

        <table class="tablemain">
            <thead>
                <tr>
                    <th>Mês/Ano</th>
                    <th>Início coleta</th>
                    <th>Início qualificação</th>
                    <th>Início análise de risco</th>
                    <th>Início Fechamento</th>
                    <th>Fechamento</th>
                    <th style="width: 50px;"></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="54">
                        Nenhum resultado encontrado.
                    </td>
                </tr>
            </tbody>
        </table>
    </Dashboard>
</template>
