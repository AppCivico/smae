<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { useCiclosStore } from '@/stores/ciclos.store';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import dateToTitle from '@/helpers/dateToTitle';

defineProps({
  parentPage: {
    type: String,
    default: '',
  },
});

const authStore = useAuthStore();
const { permissions, user } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const {
  meta_id: metaId,
  iniciativa_id: iniciativaId,
  atividade_id: atividadeId,
} = route.params;

const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);
if (!activePdm.value.id) PdMStore.getActive();

const CiclosStore = useCiclosStore();
const { SingleMeta } = storeToRefs(CiclosStore);
const CurrentMeta = ref('');
const CurrentIniciativa = ref('');
const CurrentAtividade = ref('');
if (metaId) {
  (async () => {
    await CiclosStore.getMetaById(metaId);
    CurrentMeta.value = SingleMeta.value;
    if (iniciativaId) {
      CurrentIniciativa.value = CurrentMeta.value?.meta?.iniciativas
        .find((x) => x.iniciativa.id === Number(iniciativaId));
    }
    if (atividadeId) {
      CurrentAtividade.value = CurrentIniciativa.value?.atividades
        .find((x) => x.atividade.id === Number(atividadeId));
    }
  })();
}
</script>
<template>
  <div id="submenu">
    <div
      v-if="metaId"
      class="breadcrumbmenu"
    >
      <router-link :to="`/monitoramento/${parentPage}`">
        <span>{{ activePdm?.ciclo_fisico_ativo?.data_ciclo
          ? dateToTitle(activePdm.ciclo_fisico_ativo.data_ciclo)
          : 'Ciclo ativo' }}</span>
      </router-link>

      <router-link
        v-if="metaId && CurrentMeta.meta?.id"
        :to="`/monitoramento/${parentPage}/${metaId}`"
      >
        <span>Meta {{ CurrentMeta.meta?.codigo }} {{ CurrentMeta.meta?.titulo }}</span>
      </router-link>
      <router-link
        v-if="iniciativaId && activePdm.possui_iniciativa && CurrentIniciativa.iniciativa?.id"
        :to="`/monitoramento/${parentPage}/${metaId}/${iniciativaId}`"
      >
        <span>
          {{ activePdm.rotulo_iniciativa }}
          {{ CurrentIniciativa.iniciativa?.codigo }}
          {{ CurrentIniciativa.iniciativa?.titulo }}
        </span>
      </router-link>
      <router-link
        v-if="atividadeId && activePdm.possui_atividade && CurrentAtividade.atividade?.id"
        :to="`/monitoramento/${parentPage}/${metaId}/${iniciativaId}/${atividadeId}`"
      >
        <span>
          {{ activePdm.rotulo_atividade }}
          {{ CurrentAtividade.atividade?.codigo }}
          {{ CurrentAtividade.atividade?.titulo }}
        </span>
      </router-link>
    </div>

    <div
      v-if="user?.flags?.mf_v2"
      class="subpadding"
    >
      <h2>Monitoramento</h2>
      <div class="links-container mb2">
        <router-link to="/monitoramento">
          Ciclo vigente
        </router-link>
      </div>
    </div>

    <div
      v-else
      class="subpadding"
    >
      <h2>Ciclo vigente</h2>
      <div class="links-container mb2">
        <router-link to="/monitoramento/fases">
          Metas por fase do ciclo
        </router-link>
        <router-link to="/monitoramento/evolucao">
          Coleta - Evolução
        </router-link>
        <router-link to="/monitoramento/cronograma">
          Coleta - Cronograma
        </router-link>
        <!--
          <router-link v-if="perm.PDM?.admin_cp||perm.PDM?.tecnico_cp" class="disabled"
          to="/monitoramento/">
            Qualificação
          </router-link>
          <router-link v-if="perm.PDM?.admin_cp||perm.PDM?.tecnico_cp" class="disabled"
          to="/monitoramento/">
            Análise de risco
          </router-link>
          <router-link v-if="perm.PDM?.admin_cp||perm.PDM?.tecnico_cp" class="disabled"
          to="/monitoramento/">
            Fechamento
          </router-link>
        -->
      </div>
      <template
        v-if="perm.CadastroCicloFisico
          || perm.PDM?.admin_cp
          || perm.CadastroIndicador?.inserir
          || perm.PDM?.tecnico_cp
        "
      >
        <h2>Configuração</h2>
        <div class="links-container mb2">
          <router-link to="/monitoramento/ciclos">
            Próximos ciclos
          </router-link>
          <router-link to="/monitoramento/ciclos/fechados">
            Ciclos fechados
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>
