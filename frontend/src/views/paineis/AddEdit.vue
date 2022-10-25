<script setup>
    import { ref, onMounted, onUpdated } from 'vue';
    import { Dashboard} from '@/components';
    import { Form, Field } from 'vee-validate';
    import * as Yup from 'yup';
    import { useRoute } from 'vue-router';
    import { router } from '@/router';
    import { storeToRefs } from 'pinia';

    import { useEditModalStore, useAlertStore, usePaineisStore } from '@/stores';
    import { default as SelecionarMetas } from '@/views/paineis/SelecionarMetas.vue';

    const editModalStore = useEditModalStore();
    const alertStore = useAlertStore();
    const route = useRoute();
    const painel_id = route.params.painel_id;

    const PaineisStore = usePaineisStore();
    const { singlePainel } = storeToRefs(PaineisStore);
    PaineisStore.clear();

    const virtualCopy = ref({
        ativo:"1",
        mostrar_planejado_por_padrao:"1",
        mostrar_acumulado_por_padrao:"1",
        mostrar_indicador_por_padrao:"1",
    });

    let title = 'Cadastro de painel de indicador';
    if (painel_id) {
        title = 'Editar painel de indicador';
        PaineisStore.getById(painel_id);
    }

    const props = defineProps(['type']);
    function start(){
        if(props.type=='editarMetas')editModalStore.modal(SelecionarMetas,props);
    }
    onMounted(()=>{start()});
    onUpdated(()=>{start()});

    const schema = Yup.object().shape({
        nome: Yup.string().required('Preencha o nome'),
        periodicidade: Yup.string().required('Selecione a periodicidade'),
        ativo: Yup.boolean().nullable(),
        mostrar_planejado_por_padrao: Yup.boolean().nullable(),
        mostrar_acumulado_por_padrao: Yup.boolean().nullable(),
        mostrar_indicador_por_padrao: Yup.boolean().nullable(),
    });

    async function onSubmit(values) {
        try {
            var msg;
            var r;

            values.ativo = !!values.ativo;
            values.mostrar_planejado_por_padrao = !!values.mostrar_planejado_por_padrao;
            values.mostrar_acumulado_por_padrao = !!values.mostrar_acumulado_por_padrao;
            values.mostrar_indicador_por_padrao = !!values.mostrar_indicador_por_padrao;

            if (painel_id&&singlePainel.value.painel_id) {
                r = await PaineisStore.update(painel_id, values);
                msg = 'Dados salvos com sucesso!';
            } else {
                r = await PaineisStore.insert(values);
                msg = 'Item adicionado com sucesso!';
            }
            if(r == true){
                await router.push('/paineis');
                alertStore.success(msg);
            }
        } catch (error) {
            alertStore.error(error);
        }
    }

    async function checkClose() {
        alertStore.confirm('Deseja sair sem salvar as alterações?','/paineis');
    }
    async function checkDelete(painel_id) {
        alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await PaineisStore.delete(painel_id)) router.push('/paineis')},'Remover');
    }
    function removeChars(x){
        x.target.value = x.target.value.replace(/[^a-zA-Z0-9,]/g,'');
    }
    function toggleAccordeon(t) {
        t.target.closest(".tzaccordeon").classList.toggle("active");
    }
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="!(singlePainel?.loading || singlePainel?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="painel_id?singlePainel:virtualCopy" v-slot="{ errors, isSubmitting }">
                <div class="mb1">
                    <label class="block">
                        <Field name="ativo" type="checkbox" value="1" class="inputcheckbox" /><span :class="{ 'error': errors.ativo }">Painel ativo</span>
                    </label>
                    <div class="error-msg">{{ errors.ativo }}</div>
                </div>
                <div class="flex g2">
                    <div class="f2">
                        <label class="label">Nome <span class="tvermelho">*</span></label>
                        <Field name="nome" type="text" class="inputtext light mb1" :class="{ 'error': errors.nome }" />
                        <div class="error-msg">{{ errors.nome }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">
                            Periodicidade<span class="tvermelho">*</span>
                        </label>
                        <Field name="periodicidade" as="select" class="inputtext light mb1" :class="{ 'error': errors.periodicidade }">
                            <option value="">Selecionar</option>
                            <option value="Mensal">Mensal</option>
                            <option value="Bimestral">Bimestral</option>
                            <option value="Trimestral">Trimestral</option>
                            <option value="Quadrimestral">Quadrimestral</option>
                            <option value="Semestral">Semestral</option>
                            <option value="Anual">Anual</option>
                        </Field>
                        <div class="error-msg">{{ errors.periodicidade }}</div>
                    </div>
                </div>
                <div class="mb1">
                    <label class="mr2"><Field name="mostrar_planejado_por_padrao" type="checkbox" value="1" class="inputcheckbox" /><span>Exibir planejado por padrão</span></label>
                    <label class="mr2"><Field name="mostrar_acumulado_por_padrao" type="checkbox" value="1" class="inputcheckbox" /><span>Exibir acumulado por padrão</span></label>
                    <label class="mr2"><Field name="mostrar_indicador_por_padrao" type="checkbox" value="1" class="inputcheckbox" /><span>Exibir indicador por padrão</span></label>
                </div>
                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        <template v-if="singlePainel.id">
            <button @click="checkDelete(singlePainel.id)" class="btn amarelo big">Remover item</button>
        </template>
        <template v-if="singlePainel?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="singlePainel?.error||error">
            <div class="error p1">
                <div class="error-msg">{{singlePainel.error??error}}</div>
            </div>
        </template>
        
        <hr class="f1 mb1 mt1" />

        <!-- <h5 class="tc500 uc">Conteúdo</h5>
        <div class="search mb2">
            <input placeholder="Buscar" type="text" class="inputtext" />
        </div>
        <table class="tablemain">
            <tbody>
                <tr class="tzaccordeon" @click="toggleAccordeon">
                    <td style="widht: 50%">
                        <div class="flex">
                            <svg class="arrow" width="13" height="8">
                                <use xlink:href="#i_down"></use>
                            </svg>
                            <span class="w700">Meta 1</span>
                        </div>
                    </td>

                    <td style="text-align: right; width: 50%">
                        <a href="#" class="tprimary mr1">
                            <svg width="20" height="20" class="blue">
                                <use xlink:href="#i_edit"></use>
                            </svg>
                        </a>
                        <a href="#" class="tprimary">
                            <svg width="20" height="20" class="blue">
                                <use xlink:href="#i_waste"></use>
                            </svg>
                        </a>
                    </td>
                </tr>
                <tz>
                    <td colspan="56" style="padding-left: 0">
                        <table class="tablemain no-border mb1">
                            <thead>
                                <tr class="no-border">
                                    <th>Periodicidade</th>
                                    <th>Período</th>
                                    <th>Meses</th>
                                    <th>Planejado</th>
                                    <th>Acumulado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="no-border bgc50">
                                    <td>Mensal</td>
                                    <td>Meses anteriores</td>
                                    <td>12</td>
                                    <td>Sim</td>
                                    <td>-</td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="tablemain no-border">
                            <thead>
                                <tr class="no-border">
                                    <th>
                                        Conteúdo da meta incluso na visão de evolução
                                        <a href="#" style="float: right">
                                            <svg width="20" height="20" class="blue">
                                                <use xlink:href="#i_edit"></use>
                                            </svg>
                                        </a>
                                    </th>
                                </tr>
                            </thead>
                            <hr />
                            <thead class="subtable">
                                <tr>
                                    <th class="">
                                        <a href="#" class="tprimary">
                                            <svg width="20" height="20" class="blue mr05">
                                                <use xlink:href="#i_graf"></use>
                                            </svg>
                                        </a>
                                        Iniciativa 1.1 Lorem Ipsum Dolor - integra indicador da meta
                                    </th>
                                </tr>
                                <tr>
                                    <td class="w700">Indicador da Iniciativa 1.1</td>
                                </tr>
                                <tr>
                                    <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                                </tr>
                                <tr>
                                    <th class="pl2">
                                        <a href="#" class="tprimary">
                                            <svg width="20" height="20" class="blue mr05">
                                                <use xlink:href="#i_graf"></use>
                                            </svg>
                                        </a>
                                        Iniciativa 1.1 Lorem Ipsum Dolor - integra indicador da meta
                                    </th>
                                </tr>
                                <tr>
                                    <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                                </tr>
                                <tr>
                                    <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                                </tr>
                                <tr>
                                    <th class="pl2">
                                        <a href="#" class="tprimary">
                                            <svg width="20" height="20" class="blue mr05">
                                                <use xlink:href="#i_graf"></use>
                                            </svg>
                                        </a>
                                        Iniciativa 1.1 Lorem Ipsum Dolor - integra indicador da meta
                                    </th>
                                </tr>
                                <tr>
                                    <td class="pl2 w700">
                                        Variável simples 1 da Atividade 1.1.1
                                    </td>
                                </tr>
                                <tr>
                                    <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                                </tr>
                            </thead>
                        </table>
                    </td>
                </tz>
            </tbody>
        </table>
        <label class="addlink mt2">
            <svg width="20" height="20"><use xlink:href="#i_+"></use></svg>
            <span>Adicionar Meta(s)</span>
        </label>
        <hr class="mt1 mb2" /> -->
    </Dashboard>
</template>
