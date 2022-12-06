<script setup>
    import { ref, reactive, onMounted } from 'vue';
    import { Form, Field } from 'vee-validate';
    import * as Yup from 'yup';
    import { useRoute } from 'vue-router';
    import { router } from '@/router';
    import { storeToRefs } from 'pinia';
    import { useAlertStore, useEditModalStore, useCiclosStore } from '@/stores';

    const editModalStore = useEditModalStore();
    const alertStore = useAlertStore();
    const route = useRoute();
    const ciclo_id = route.params.ciclo_id;

    const CiclosStore = useCiclosStore();
    const { SingleCiclo } = storeToRefs(CiclosStore);
    CiclosStore.getCicloById(ciclo_id);

    var regx = /^$|^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
    const schema = Yup.object().shape({
        inicio_coleta: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'),
        inicio_qualificacao: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'),
        inicio_analise_risco: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'),
        inicio_fechamento: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'),
        fechamento: Yup.string().required('Preencha a data').matches(regx,'Formato inválido')
    });

    async function onSubmit(values) {
        try {
            var msg;
            var r;

            values.inicio_coleta = fieldToDate(values.inicio_coleta);
            values.inicio_qualificacao = fieldToDate(values.inicio_qualificacao);
            values.inicio_analise_risco = fieldToDate(values.inicio_analise_risco);
            values.inicio_fechamento = fieldToDate(values.inicio_fechamento);
            values.fechamento = fieldToDate(values.fechamento);

            r = await CiclosStore.updateCiclos(SingleCiclo.value.id, values);
            msg = 'Dados salvos com sucesso!';

            if(r == true){
                CiclosStore.clear();
                CiclosStore.getCiclos();
                await router.push('/monitoramento/ciclos');
                alertStore.success(msg);
                editModalStore.clear();
            }
        } catch (error) {
            alertStore.error(error);
        }
    }
    async function checkClose() {
        alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ 
            router.go(-1);  
            editModalStore.clear(); 
            alertStore.clear(); 
        });
    }
    function dateToTitle(d) {
        var dd=d?new Date(d):false;
        if(!dd) return d;
        var month = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][dd.getUTCMonth()];
        var year = dd.getUTCFullYear();
        return `${month} ${year}`;
    }
    function fieldToDate(d){
        if(d){
            var x=d.split('/');
            return (x.length==3) ? new Date(Date.UTC(x[2],x[1]-1,x[0])).toISOString().substring(0, 10) : null;
        }
        return null;
    }
    function maskDate(el){
        var kC = event.keyCode;
        var data = el.target.value.replace(/[^0-9/]/g,'');
        if( kC!=8 && kC!=46 ){
            if( data.length==2 ){
                el.target.value = data += '/';
            }else if( data.length==5 ){
                el.target.value = data += '/';
            }else{
                el.target.value = data;
            }
        }
    }
</script>
<template>
    <div class="flex spacebetween center mb2">
        <div class="t48"><strong>Editar Ciclo</strong><br>{{dateToTitle(SingleCiclo.data_ciclo)}}</div>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(SingleCiclo?.loading || SingleCiclo?.error)">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="SingleCiclo" v-slot="{ errors, isSubmitting }">
            <div class="flex g2">
                <div class="f1">
                    <label class="label">Início coleta <span class="tvermelho">*</span></label>
                    <Field name="inicio_coleta" type="text" class="inputtext light mb1" :class="{ 'error': errors.inicio_coleta }" maxlength="10" @keyup="maskDate" />
                    <div class="error-msg">{{ errors.inicio_coleta }}</div>
                </div>
                <div class="f1">
                    <label class="label">Início qualificação <span class="tvermelho">*</span></label>
                    <Field name="inicio_qualificacao" type="text" class="inputtext light mb1" :class="{ 'error': errors.inicio_qualificacao }" maxlength="10" @keyup="maskDate" />
                    <div class="error-msg">{{ errors.inicio_qualificacao }}</div>
                </div>
            </div>
            <div class="flex g2">
                <div class="f1">
                    <label class="label">Início análise de risco <span class="tvermelho">*</span></label>
                    <Field name="inicio_analise_risco" type="text" class="inputtext light mb1" :class="{ 'error': errors.inicio_analise_risco }" maxlength="10" @keyup="maskDate" />
                    <div class="error-msg">{{ errors.inicio_analise_risco }}</div>
                </div>
                <div class="f1">
                    <label class="label">Início fechamento <span class="tvermelho">*</span></label>
                    <Field name="inicio_fechamento" type="text" class="inputtext light mb1" :class="{ 'error': errors.inicio_fechamento }" maxlength="10" @keyup="maskDate" />
                    <div class="error-msg">{{ errors.inicio_fechamento }}</div>
                </div>
            </div>
            <div class="flex g2">
                <div class="f1">
                    <label class="label">Fechamento <span class="tvermelho">*</span></label>
                    <Field name="fechamento" type="text" class="inputtext light mb1" :class="{ 'error': errors.fechamento }" maxlength="10" @keyup="maskDate" />
                    <div class="error-msg">{{ errors.fechamento }}</div>
                </div>
            </div>
            <div class="flex spacebetween center mb2">
                <hr class="mr2 f1"/>
                <button class="btn big" :disabled="isSubmitting">Salvar</button>
                <hr class="ml2 f1"/>
            </div>
        </Form>
    </template>
    <template v-if="SingleCiclo?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="SingleCiclo?.error||error">
        <div class="error p1">
            <div class="error-msg">{{SingleCiclo.error??error}}</div>
        </div>
    </template>
</template>
