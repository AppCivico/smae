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
    const meta_id = route.params.meta_id;
    const cron_id = route.params.cron_id;
    const etapa_id = route.params.etapa_id;

    const CiclosStore = useCiclosStore();
    const { SingleEtapa } = storeToRefs(CiclosStore);
    CiclosStore.getEtapaById(cron_id,etapa_id);

    var regx = /^$|^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
    const schema = Yup.object().shape({
        inicio_real: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'),
        termino_real: Yup.string().required('Preencha a data').matches(regx,'Formato inválido')
    });

    async function onSubmit(values) {
        try {
            var msg;
            var r;

            values.inicio_real = fieldToDate(values.inicio_real);
            values.termino_real = fieldToDate(values.termino_real);

            r = await CiclosStore.updateEtapa(SingleEtapa.value.id, values);
            msg = 'Dados salvos com sucesso!';
            
            if(r == true){
                CiclosStore.clear();
                CiclosStore.getMetaById(meta_id);
                CiclosStore.getCronogramasActiveByParent(meta_id,'meta_id');
                await router.push(`/monitoramento/cronograma/${meta_id}`);
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
    function fieldToDate(d){
        if(d){
            if(d.length==6){d = '01/0'+d;}
            else if(d.length==7){d = '01/'+d;}
            var x=d.split('/');
            return (x.length==3) ? new Date(Date.UTC(x[2],x[1]-1,x[0])).toISOString().substring(0, 10) : null;
        }
        return null;
    }
</script>
<template>
    <div class="flex spacebetween center mb2">
        <div class="t48"><strong>Atualizar</strong><br>{{SingleEtapa?.titulo}}</div>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(SingleEtapa?.loading || SingleEtapa?.error)">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="SingleEtapa" v-slot="{ errors, isSubmitting }">
            <div class="flex g2 mb2">
                <div class="f1">
                    <label class="label tc300">Início Previsto</label>
                    <div class="t13">{{SingleEtapa.inicio_previsto}}</div>
                </div>
                <div class="f1">
                    <label class="label tc300">Término Previsto</label>
                    <div class="t13">{{SingleEtapa.termino_previsto}}</div>
                </div>
            </div>
            <div class="flex g2">
                <div class="f1">
                    <label class="label">Início Real <span class="tvermelho">*</span></label>
                    <Field name="inicio_real" type="text" class="inputtext light mb1" :class="{ 'error': errors.inicio_real }" maxlength="10" @keyup="maskDate" />
                    <div class="error-msg">{{ errors.inicio_real }}</div>
                </div>
                <div class="f1">
                    <label class="label">Término real <span class="tvermelho">*</span></label>
                    <Field name="termino_real" type="text" class="inputtext light mb1" :class="{ 'error': errors.termino_real }" maxlength="10" @keyup="maskDate" />
                    <div class="error-msg">{{ errors.termino_real }}</div>
                </div>
            </div>
            <div class="flex spacebetween center mb2">
                <hr class="mr2 f1"/>
                <button class="btn big" :disabled="isSubmitting">Salvar</button>
                <hr class="ml2 f1"/>
            </div>
        </Form>
    </template>
    <template v-else-if="SingleEtapa?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-else-if="SingleEtapa?.error||error">
        <div class="error p1">
            <div class="error-msg">{{SingleEtapa.error??error}}</div>
        </div>
    </template>
    <template v-else>
        <span>Etapa não encontrada</span>
    </template>
</template>
