<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useEditModalStore, useVariaveisStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();

const indicador_id = route.params.indicador_id;
const var_id = route.params.var_id;

const currentEdit = route.path.slice(0,route.path.indexOf('/variaveis'));

const VariaveisStore = useVariaveisStore();
const { singleVariaveis, Valores } = storeToRefs(VariaveisStore);
VariaveisStore.clearEdit();
VariaveisStore.getById(indicador_id,var_id);

let Realizado = ref(null);
let RealizadoAcumulado = ref(null);
let decimais = ref(0);
(async()=>{
    await VariaveisStore.getValores(var_id);
    Realizado.value = Valores.value[var_id]?.ordem_series.indexOf('Realizado');
    RealizadoAcumulado.value = Valores.value[var_id]?.ordem_series.indexOf('RealizadoAcumulado');
    decimais.value = Valores.value[var_id]?.variavel?.casas_decimais??0;
})();

async function onSubmit(el) {
    event.preventDefault();
    event.stopPropagation();
    try {
        var msg;
        var r;
        var values = {valores: []};
        el.target.querySelectorAll('[name]').forEach(x=>{
            values.valores.push({
              referencia: x.name,
              valor: !isNaN(parseFloat(x.value))?String(parseFloat(x.value.replace(',','.'))):''
            });
        });

        if (var_id) { 
            r = await VariaveisStore.updateValores(values);
            if(r){
                msg = 'Valores salvos com sucesso!';
                VariaveisStore.getValores(var_id);
                alertStore.success(msg);
                editModalStore.clear();
                router.push(`${currentEdit}`);
            }
        }
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ 
        editModalStore.clear();
        alertStore.clear();
        router.go(-1);
    });
}
function acumular(a,j){
    if(!a.length) return;
    var s = 0;
    for (var i = 0; i <= j; i++) {
        var x = a[i].series[Realizado.value]?.valor_nominal??'0';
        var n = !isNaN(parseFloat(x))?parseFloat(x.replace(',','.')):0;
        if(n)s+=n;
    }
    return s.toFixed(decimais.value);
}
function soma(a,j) {
    var x = event.target.value;
    a[j].series[Realizado.value].valor_nominal = x;
}
</script>

<template>
    <div class="flex spacebetween center mb2">
        <h2>Editar valores</h2>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(Valores[var_id]?.loading || Valores[var_id]?.error)&&var_id">
        <div class="label">Valores realizados e realizados acumulados para cada período <span class="tvermelho">*</span></div>
        <hr class="mb2">
        <form @submit="onSubmit">
            <div class="flex g2">
                <div class="f1">
                    <label class="label tc300">Realizado</label>
                </div>
                <div class="f1">
                    <label class="label tc300">Realizado Acumulado</label>
                </div>
            </div>
            <div v-if="Valores[var_id]?.linhas">
                <div class="flex g2" v-for="(v,i) in Valores[var_id].linhas" :key="i">
                    <div class="f1">
                        <label class="label">Realizado {{v.periodo}}</label>
                        <input type="number" :step="'0'+(decimais? '.'+('0'.repeat(decimais-1))+'1' : '')" :name="v.series[Realizado]?.referencia" :disabled="!v.series[Realizado]?.referencia" :value="v.series[Realizado]?.valor_nominal" class="inputtext light mb1" @input="soma(Valores[var_id].linhas,i)"/>
                    </div>
                    <div class="f1">
                        <label class="label">Acumulado {{v.periodo}}</label>
                        <input type="number" :step="'0'+(decimais? '.'+('0'.repeat(decimais-1))+'1' : '')" :name="v.series[RealizadoAcumulado]?.referencia" :value="singleVariaveis.acumulativa?acumular(Valores[var_id].linhas,i):v.series[RealizadoAcumulado]?.valor_nominal" :disabled="singleVariaveis.acumulativa||!v.series[RealizadoAcumulado]?.referencia" class="inputtext light mb1"/>
                    </div>
                </div>
            </div>

            <div class="flex spacebetween center mb2 mt2">
                <hr class="mr2 f1"/>
                <button class="btn big" :disabled="isSubmitting">Salvar</button>
                <hr class="ml2 f1"/>
            </div>
        </form>
    </template>
    <template v-if="Valores[var_id]?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="Valores[var_id]?.error">
        <div class="error p1">
            <div class="error-msg">{{Valores[var_id].error}}</div>
        </div>
    </template>
</template>
