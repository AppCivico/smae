<script setup>
import GraficoHeatmapVariavelCategorica from '@/components/GraficoHeatmapVariavelCategorica.vue';
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref } from 'vue';
import { useRoute } from 'vue-router';
// eslint-disable-next-line import/no-named-default
import OverlayIndisponivel from '@/components/OverlayIndisponivel.vue';
import GraficoLinhasEvolucao from '@/components/GraficoLinhasEvolucao.vue';
import rolarTelaPara from '@/helpers/rolarTelaPara.ts';
import { useAuthStore } from '@/stores/auth.store';
import { useIndicadoresStore } from '@/stores/indicadores.store';
import { usePdMStore } from '@/stores/pdm.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';

const route = useRoute();

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const props = defineProps(['group', 'parentlink', 'parent_id', 'parent_field']);

const IndicadoresStore = useIndicadoresStore();
const { tempIndicadores, ValoresInd } = storeToRefs(IndicadoresStore);

const activePdm = computed(() => {
  switch (route.meta.entidadeMãe) {
    case 'planoSetorial':
    case 'programaDeMetas':
      return usePlanosSetoriaisStore(route.meta.entidadeMãe).emFoco;

    case 'pdm':
      return usePdMStore().activePdm;

    default:
      throw new Error('Módulo não pôde ser determinado');
  }
});

const contagemDeRecarregamentos = ref(0);
const numeroMaximoDeRecarregamentos = ref(2);

async function iniciar(forcarAtualizacao = false) {
  contagemDeRecarregamentos.value += 1;
  if (
    !tempIndicadores.value.length
    // mantendo comportamento legado
    // eslint-disable-next-line eqeqeq
    || tempIndicadores.value[0][props.parent_field] != props.parent_id
    || forcarAtualizacao
  ) {
    await IndicadoresStore.filterIndicadores(props.parent_id, props.parent_field);
  }

  if (tempIndicadores.value[0]?.id) {
    await IndicadoresStore.getValores(tempIndicadores.value[0]?.id);
  }

  nextTick().then(() => {
    rolarTelaPara();
  });
}

iniciar();
</script>
<template>
  <template v-if="tempIndicadores.length">
    <div class="t12 uc w700 mb05 tc300 mb1">
      Indicador
    </div>

    <div
      v-for="ind in tempIndicadores"
      :key="ind.id"
      style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;"
    >
      <div class="p1">
        <div class="flex center g2">
          <SmaeLink
            :to="`${parentlink}/evolucao`"
            class="flex center f1 g2"
          >
            <svg
              class="f0"
              style="flex-basis: 2rem;"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              color="#F2890D"
              xmlns="http://www.w3.org/2000/svg"
            ><use xlink:href="#i_indicador" /></svg>
            <h2 class="mt1 mb1">
              {{ ind.titulo }}
            </h2>
          </SmaeLink>
          <SmaeLink
            v-if="temPermissãoPara([
              'CadastroMeta.administrador_no_pdm',
              'CadastroMetaPS.administrador_no_pdm',
              'CadastroMetaPDM.administrador_no_pdm',
              'SMAE.GrupoVariavel.participante',
            ]) && activePdm?.pode_editar"
            :to="`${parentlink}/indicadores/${ind.id}`"
            title="Editar indicador"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
        </div>
        <div class="relative">
          <OverlayIndisponivel
            v-if="ind.recalculando"
            :tem-tentar-novamente="true"
            :texto-descritivo="ind.recalculo_erro"
            :tentar-novamente-em="contagemDeRecarregamentos >= numeroMaximoDeRecarregamentos
              ? null
              : ind.recalculo_tempo "
            @recarregar-dados="iniciar(true)"
          />
          <GraficoHeatmapVariavelCategorica
            v-if="ValoresInd[ind.id]?.variavel?.variavel_categorica_id"
            :valores="ValoresInd[ind.id]"
          />
          <GraficoLinhasEvolucao
            v-else
            :valores="ValoresInd[ind.id]"
          />
          <div class="tc">
            <SmaeLink
              :to="`${parentlink}/evolucao`"
              class="btn big mt1 mb1"
            >
              <span>Acompanhar evolução</span>
            </SmaeLink>
          </div>
        </div>
      </div>
    </div>
  </template>
  <div
    v-if="!tempIndicadores.length && !tempIndicadores.loading"
    style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;"
  >
    <div class="p1">
      <h2 class="mt1 mb1">
        Evolução
      </h2>
    </div>
    <div
      v-if="temPermissãoPara([
        'CadastroMeta.administrador_no_pdm',
        'CadastroMetaPS.administrador_no_pdm',
        'CadastroMetaPDM.administrador_no_pdm'
      ]) && activePdm?.pode_editar"
      class="bgc50"
    >
      <div class="tc">
        <SmaeLink
          :to="`${parentlink}/indicadores/novo`"
          class="btn mt1 mb1"
        >
          <span>Adicionar indicador</span>
        </SmaeLink>
      </div>
    </div>
  </div>
</template>
