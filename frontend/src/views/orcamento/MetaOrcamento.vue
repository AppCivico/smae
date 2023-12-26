<script setup>
import { default as SimpleOrcamentoCusteio } from '@/components/orcamento/SimpleOrcamentoCusteio.vue';
import { default as SimpleOrcamentoPlanejado } from '@/components/orcamento/SimpleOrcamentoPlanejado.vue';
import { default as SimpleOrcamentoRealizado } from '@/components/orcamento/SimpleOrcamentoRealizado.vue';
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, onUpdated, ref,
} from 'vue';
import { useRoute } from 'vue-router';

import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';

const alertStore = useAlertStore();
const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;
const editModalStore = useEditModalStore();

const props = defineProps(['area', 'title']);

const SimpleOrcamento = props.area == 'Realizado' ? SimpleOrcamentoRealizado : props.area == 'Planejado' ? SimpleOrcamentoPlanejado : SimpleOrcamentoCusteio;

const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);
const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}${iniciativa_id ? `/iniciativas/${iniciativa_id}` : ''}${atividade_id ? `/atividades/${atividade_id}` : ''}`;
const parent_id = atividade_id ?? iniciativa_id ?? meta_id ?? false;
const parent_field = atividade_id ? 'atividade_id' : iniciativa_id ? 'iniciativa_id' : meta_id ? 'meta_id' : false;
const parentLabel = ref(atividade_id ? '-' : iniciativa_id ? '-' : meta_id ? 'Meta' : false);

const conclusãoPendente = ref(false);
const campoPlanoConcluído = ref(null);

const OrcamentosStore = useOrcamentosStore();

const { OrcamentoRealizadoConclusão } = storeToRefs(OrcamentosStore);

OrcamentosStore.clear();

const orçamentosEmOrdemDecrescente = computed(() => (Array.isArray(activePdm.value.orcamento_config)
  ? activePdm.value.orcamento_config
    // adicionando uma chave para ser usada como Object.key
    // porque números causam sua reordenação
    .map((x) => ({ ...x, chave: `_${x.ano_referencia}` }))
    .sort((a, b) => b.ano_referencia - a.ano_referencia)
  : []));
const anoCorrente = new Date().getUTCFullYear();
const dadosExtrasDeAbas = computed(() => orçamentosEmOrdemDecrescente.value.reduce((acc, cur) => {
  acc[`_${cur.ano_referencia}`] = {
    etiqueta: cur.ano_referencia,
  };
  if (Number(anoCorrente) === Number(cur.ano_referencia)) {
    acc[`_${cur.ano_referencia}`].aberta = true;
  }
  return acc;
}, {}));

async function start() {
  await MetasStore.getPdM();
  if (atividade_id) parentLabel.value = activePdm.value.rotulo_atividade;
  else if (iniciativa_id) parentLabel.value = activePdm.value.rotulo_iniciativa;
  if (Array.isArray(activePdm.value.orcamento_config)) {
    activePdm.value.orcamento_config.forEach((x) => {
      if (x.execucao_disponivel && props.area === 'Realizado') {
        OrcamentosStore.getOrcamentoRealizadoById(meta_id, x.ano_referencia);
      }
      if (x.planejado_disponivel && props.area === 'Planejado') {
        OrcamentosStore.getOrcamentoPlanejadoById(meta_id, x.ano_referencia);
      }
      if (x.previsao_custo_disponivel && props.area === 'Custo') {
        OrcamentosStore.getOrcamentoCusteioById(meta_id, x.ano_referencia);
      }
    });
  }
}

async function concluirOrçamento(valor, metaId, ano) {
  const carga = {
    meta_id: metaId,
    ano_referencia: ano,
    concluido: valor,
  };
  conclusãoPendente.value = true;

  try {
    const resultado = await OrcamentosStore.closeOrcamentoRealizado(carga);

    // Mudar estado do botão enquanto a nova requisição não chega
    OrcamentoRealizadoConclusão.value[ano].concluido = resultado
      ? valor
      : !valor;
  } catch (error) {
    OrcamentoRealizadoConclusão.value[ano].concluido = !valor;
  } finally {
    // recarregar o ano inteiro do orçamento para atualizar as permissões, que
    // podem ter mudado como resultado dessa ação ou de edição por um terceiro,
    // o que causou um possível erro
    await start();

    conclusãoPendente.value = false;
    campoPlanoConcluído.value.checked = !!OrcamentoRealizadoConclusão.value[ano].concluido;
  }
}

start();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo">
        {{ parentLabel }}
      </div>
      <h1>{{ title }}</h1>
    </div>
    <hr class="ml2 f1">
  </div>

  <EnvelopeDeAbas
    v-if="orçamentosEmOrdemDecrescente.length"
    class="boards"
    :meta-dados-por-id="dadosExtrasDeAbas"
  >
    <template
      v-for="orc in orçamentosEmOrdemDecrescente"
      #[orc.chave]
      :key="orc.chave"
    >
      <SimpleOrcamento
        :meta_id="meta_id"
        :config="orc"
        :parentlink="parentlink"
        @apagar="start"
      >
        <template #cabeçalho="{ ano }">
          <label
            v-if="!!OrcamentoRealizadoConclusão[ano]?.pode_editar"
            class="conclusão-de-plano__label ml2"
            :class="{ loading: conclusãoPendente }"
          >
            <input
              ref="campoPlanoConcluído"
              type="checkbox"
              name="plano-concluído"
              class="interruptor"
              :checked="OrcamentoRealizadoConclusão[ano]?.concluido"
              @change="($event) => {
                concluirOrçamento(
                  $event.target.checked, Number($route.params.meta_id), ano
                );
              }"
            >
            <template
              v-if="OrcamentoRealizadoConclusão[ano]?.concluido"
            >
              Concluído
            </template>
            <template v-else>
              Concluir
            </template>
          </label>
        </template>
      </SimpleOrcamento>
    </template>
  </EnvelopeDeAbas>

  <template v-else-if="activePdm.error">
    <div class="error p1">
      <p class="error-msg">
        Error: {{ activePdm.error }}
      </p>
    </div>
  </template>
</template>
