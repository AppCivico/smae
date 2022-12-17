<script setup>
    import { ref, reactive } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Dashboard} from '@/components';
    import { default as listVars } from '@/components/monitoramento/listVars.vue';
    import { default as countVars } from '@/components/monitoramento/countVars.vue';
    import { default as modalRealizado } from '@/components/monitoramento/modalRealizado.vue';
    import { default as sidebarRealizado } from '@/components/monitoramento/sidebarRealizado.vue';

    import { default as modalAnaliseRisco } from '@/components/monitoramento/modalAnaliseRisco.vue';
    import { default as modalFechamento } from '@/components/monitoramento/modalFechamento.vue';
    import { default as modalQualificacaoMeta } from '@/components/monitoramento/modalQualificacaoMeta.vue';

    import { useEditModalStore, useSideBarStore, useAlertStore, useAuthStore, usePdMStore, useCiclosStore } from '@/stores';
    import { useRoute } from 'vue-router';
    import { router } from '@/router';
    
    const baseUrl = `${import.meta.env.VITE_API_URL}`;
    
    const route = useRoute();
    const meta_id = route.params.meta_id;

    const SideBarStore = useSideBarStore();
    const editModalStore = useEditModalStore();
    const alertStore = useAlertStore();

    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const PdMStore = usePdMStore();
    const { activePdm } = storeToRefs(PdMStore);

    const CiclosStore = useCiclosStore();
    const { SingleMeta, MetaVars, SingleMetaAnalise, SingleMetaAnaliseDocs, SingleRisco, SingleFechamento } = storeToRefs(CiclosStore);
    CiclosStore.getMetaById(meta_id);
    CiclosStore.getMetaVars(meta_id);

    (async()=>{
        if(!activePdm.value.id)await PdMStore.getActive();
        CiclosStore.getMetaAnalise(activePdm.value.ciclo_fisico_ativo.id,meta_id);
        CiclosStore.getMetaRisco(activePdm.value.ciclo_fisico_ativo.id,meta_id);
        CiclosStore.getMetaFechamento(activePdm.value.ciclo_fisico_ativo.id,meta_id);
    })();

    function dateToField(d){
        var dd=d?new Date(d):false;
        return (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
    }
    function dateToTitle(d) {
        var dd=d?new Date(d):false;
        if(!dd) return d;
        var month = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][dd.getUTCMonth()];
        var year = dd.getUTCFullYear();
        return `${month} ${year}`;
    }
    function checkClose(){
        alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ 
            editModalStore.clear(); 
            alertStore.clear(); 
        });
    }
    function editPeriodo(parent,var_id,periodo){
        editModalStore.clear();
        editModalStore.modal(modalRealizado,{'parent':parent,'var_id':var_id,'periodo':periodo,'checkClose':checkClose});
    }
    function abrePeriodo(parent,var_id,periodo){
        SideBarStore.clear();
        SideBarStore.modal(sidebarRealizado,{'parent':parent,'var_id':var_id,'periodo':periodo});
    }
    function confirmFase(id,f){
        let z = activePdm.value.ciclo_fisico_ativo.fases.find(x=>x.ciclo_fase==f);
        
        if(z) alertStore.confirmAction(
            'Deseja mesmo avançar a etapa?',
            async()=>{alertStore.clear(); await CiclosStore.updateFase(id,{ciclo_fase_id: z.id}); router.go(); },
            'Avançar',
            ()=>{alertStore.clear();},
        );
    }

    function fecharciclo(ciclo_id,meta_id,parent){
        editModalStore.clear();
        editModalStore.modal(modalFechamento,{'ciclo_id':ciclo_id,'meta_id':meta_id,'parent':parent,'checkClose':checkClose});
    }
    function analisederisco(ciclo_id,meta_id,parent){
        editModalStore.clear();
        editModalStore.modal(modalAnaliseRisco,{'ciclo_id':ciclo_id,'meta_id':meta_id,'parent':parent,'checkClose':checkClose});
    }
    function qualificar(ciclo_id,meta_id,parent){
        editModalStore.clear();
        editModalStore.modal(modalQualificacaoMeta,{'ciclo_id':ciclo_id,'meta_id':meta_id,'parent':parent,'checkClose':checkClose});
    }
    function vazio(s){
        return s ? s : '-';
    }
</script>
<template>
    <Dashboard>
        <div class="label tamarelo">Evolução da Meta</div>
        <div class="mb2">
            <div class="flex spacebetween center">
                <h2>Meta {{SingleMeta.codigo}} - {{SingleMeta.titulo}}</h2>
                <hr class="ml2 f1" />
                <div class="ml2 dropbtn" v-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)&&!['Fechamento'].includes(SingleMeta.fase)">
                    <span class="btn">Avançar etapa</span>
                    <ul>
                        <li><a v-if="['Coleta'].includes(SingleMeta.fase)" @click="confirmFase(SingleMeta.id,'Analise')" to="/metas/tags/novo">Qualificação</a></li>
                        <li><a v-if="['Coleta','Analise'].includes(SingleMeta.fase)" @click="confirmFase(SingleMeta.id,'Risco')" to="/metas/tags/novo">Análise de Risco</a></li>
                        <li><a v-if="['Coleta','Analise','Risco'].includes(SingleMeta.fase)" @click="confirmFase(SingleMeta.id,'Fechamento')" to="/metas/tags/novo">Fechamento</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="mb2" v-if="SingleFechamento.comentario?.length">
            <div class="flex spacebetween center mb1">
                <h2>Fechamento do Ciclo</h2>
                <hr class="ml2 f1" />
                <a v-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)" class="tprimary ml1" @click="fecharciclo(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></a>
            </div>
            <div class="label tc300">Comentários</div>
            <div>{{vazio(SingleFechamento.comentario)}}</div>
        </div>
        <div v-else-if="SingleFechamento.loading">
            <span class="spinner">Carregando</span>
        </div>
        <div class="p1 bgc50 tc mb2" v-else-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)&&['Fechamento'].includes(SingleMeta.fase)">
            <a class="btn" @click="fecharciclo(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)">Fechar ciclo</a>
        </div>

        <div class="mb2" v-if="SingleRisco.detalhamento||SingleRisco.ponto_de_atencao">
            <div class="flex spacebetween center mb1">
                <h2>Análise de Risco</h2>
                <hr class="ml2 f1" />
                <a v-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)" class="tprimary ml1" @click="analisederisco(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></a>
            </div>
            <div class="label tc300">Detalhamento</div>
            <div class="contentStyle mb2" v-html="SingleRisco.detalhamento"></div>
            <div class="label tc300">Pontos de atenção</div>
            <div class="contentStyle " v-html="SingleRisco.ponto_de_atencao"></div>
        </div>
        <div v-else-if="SingleRisco.loading">
            <span class="spinner">Carregando</span>
        </div>
        <div class="p1 bgc50 tc mb2" v-else-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)&&['Risco','Fechamento'].includes(SingleMeta.fase)">
            <a class="btn" @click="analisederisco(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)">Adicionar Análise de Risco</a>
        </div>

        <div class="mb2" v-if="SingleMetaAnalise.informacoes_complementares">
            <div class="flex spacebetween center mb1">
                <h2>Qualificação</h2>
                <hr class="ml2 f1" />
                <a v-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)" class="tprimary ml1" @click="qualificar(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></a>
            </div>
            <div class="label tc300">Informações complementares</div>
            <div>{{vazio(SingleMetaAnalise.informacoes_complementares)}}</div>

            <table class="tablemain mt2 mb2 pl0">
                <thead>
                    <tr>
                        <th style="width: 30%">Documentos relacionados</th>
                        <th style="width: 70%">Descrição</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="SingleMetaAnaliseDocs.length">
                        <tr v-for="subitem in SingleMetaAnaliseDocs" :key="subitem.id">
                            <td><a :href="baseUrl+'/download/'+subitem?.arquivo?.download_token" download>{{  vazio(subitem?.arquivo?.nome_original)  }}</a></td>
                            <td><a :href="baseUrl+'/download/'+subitem?.arquivo?.download_token" download>{{  vazio(subitem?.arquivo?.descricao)  }}</a></td>
                        </tr>
                    </template>
                    <tr v-else><td colspan="60">Nenhum arquivo adicionado</td></tr>
                </tbody>
            </table>
        </div>
        <div v-else-if="SingleMetaAnalise.loading">
            <span class="spinner">Carregando</span>
        </div>
        <div class="p1 bgc50 tc mb2" v-else-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)&&['Coleta','Analise','Risco','Fechamento'].includes(SingleMeta.fase)">
            <a class="btn" @click="qualificar(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)">Qualificar</a>
        </div>

        <div class="boards">
            <template v-if="MetaVars.meta">
                <countVars :list="MetaVars.meta.totais"/>
                <div v-if="MetaVars.meta.indicador" style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;">
                    <div class="p1">
                        <div class="flex center g2">
                            <a class="flex center f1 g2">
                                <svg class="f0 tlaranja" style="flex-basis: 2rem;" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_indicador"></use></svg>
                                <h2 class="mt1 mb1">{{MetaVars.meta.indicador.codigo}} {{MetaVars.meta.indicador.titulo}}</h2>
                            </a>
                        </div>
                    </div>
                    <listVars :parent="MetaVars.meta" :list="MetaVars.meta.variaveis" :indexes="MetaVars.ordem_series" :editPeriodo="editPeriodo" :abrePeriodo="abrePeriodo"/>
                </div>
                <template v-if="MetaVars.meta.iniciativas.length">
                    <div class="flex spacebetween center mt4 mb2">
                        <h2 class="mb0">{{activePdm.rotulo_iniciativa}}(s) e {{activePdm.rotulo_atividade}}(s)</h2>
                        <hr class="ml2 f1"/>
                    </div>
                    <template v-for="ini in MetaVars.meta.iniciativas" :key="ini.iniciativa.id">
                        <countVars :list="ini.totais"/>
                        <div class="board_variavel mb2">
                            <header class="p1">
                                <div class="flex center g2 mb1">
                                    <a class="f0" style="flex-basis: 2rem;">
                                        <svg width="28" height="33" viewBox="0 0 32 38" color="#8EC122" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_iniciativa"></use></svg>
                                    </a>
                                    <a class="f1 mt1">
                                        <h2 class="mb1">{{ini.iniciativa.codigo}} {{ini.iniciativa.titulo}}</h2>
                                    </a>
                                </div>
                            </header>
                            <listVars :parent="ini" :list="ini.variaveis" :indexes="MetaVars.ordem_series" :editPeriodo="editPeriodo" :abrePeriodo="abrePeriodo"/>
                        </div>
                        <p class="label mb2" v-if="ini.atividades.length">{{activePdm.rotulo_atividade}}(s) em {{activePdm.rotulo_iniciativa}} {{ini.iniciativa.codigo}} {{ini.iniciativa.titulo}}</p>
                        <template v-for="ati in ini.atividades" :key="ati.atividade.id">
                            <countVars :list="ati.totais"/>
                            <div class="board_variavel mb2">
                                <header class="p1">
                                    <div class="flex center g2 mb1">
                                        <a class="f0" style="flex-basis: 2rem;">
                                            <svg width="28" height="33" viewBox="0 0 32 38" color="#8EC122" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_atividade"></use></svg>
                                        </a>
                                        <a class="f1 mt1">
                                            <h2 class="mb1">{{ati.atividade.codigo}} {{ati.atividade.titulo}}</h2>
                                        </a>
                                    </div>
                                </header>
                                <listVars :parent="ati" :list="ati.variaveis" :indexes="MetaVars.ordem_series" :editPeriodo="editPeriodo" :abrePeriodo="abrePeriodo"/>
                            </div>
                        </template>
                    </template>
                </template>

            </template>
            <template v-else-if="MetaVars.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <template v-else-if="MetaVars.error">
                <div class="error p1"><p class="error-msg">Error: {{MetaVars.error}}</p></div>
            </template>
            <template v-else>
                <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
            </template>
        </div>
    </Dashboard>
</template>
