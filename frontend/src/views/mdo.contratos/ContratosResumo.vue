<script setup>
import LoadingComponent from '@/components/LoadingComponent.vue';
import ContratosAditivos from '@/components/obras/ContratosAditivos.vue';
import { contratoDeObras } from '@/consts/formSchemas';
import { dateToShortDate } from '@/helpers/dateToDate';
import dinheiro from '@/helpers/dinheiro';
import formatProcesso from '@/helpers/formatProcesso';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useObrasStore } from '@/stores/obras.store';
import { storeToRefs } from 'pinia';
import { defineOptions, computed } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({ inheritAttrs: false });

const route = useRoute();

const contratosStore = useContratosStore(route.meta.entidadeMãe);
const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(contratosStore);

const { permissõesDaObraEmFoco } = storeToRefs(useObrasStore());
const { permissõesDoProjetoEmFoco } = storeToRefs(useProjetosStore());

const permissoesDoItemEmFoco = computed(() => (route.meta.entidadeMãe === 'obras'
  ? permissõesDaObraEmFoco.value
  : permissõesDoProjetoEmFoco.value));

const schema = computed(() => contratoDeObras(route.meta.entidadeMãe));
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Resumo de contrato
    </TítuloDePágina>

    <hr class="ml2 f1">

    <SmaeLink
      v-if="emFoco?.id
        && (!permissoesDoItemEmFoco.apenas_leitura
          || permissoesDoItemEmFoco.sou_responsavel)"
      :to="{
        name: $route.params.obraId ? 'contratosDaObraEditar' : 'contratosDoProjetoEditar',
        params: $route.params
      }"
      title="Editar contrato"
      class="btn big ml2"
    >
      Editar
    </SmaeLink>
  </div>

  <div
    v-if="emFoco"
    class="boards"
  >
    <dl class="flex g2 flexwrap">
      <div class="f1 fb10em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.numero.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.numero || '-' }}
        </dd>
      </div>
      <div class="f1 fb10em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.contrato_exclusivo.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.contrato_exclusivo ? 'Sim' : 'Não' }}
        </dd>
      </div>
      <div class="f1 fb10em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.status.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.status || '-' }}
        </dd>
      </div>
      <div class="f1 fb20em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.processos_sei.spec.label }}
        </dt>
        <dd class="t13 contentStyle">
          <ul v-if="emFoco?.processos_sei?.length">
            <li
              v-for="processoSei, i in emFoco?.processos_sei"
              :key="i"
            >
              {{ formatProcesso(processoSei) }}
            </li>
          </ul>
        </dd>
      </div>
      <div class="f1 fb10em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.orgao_id.spec.label }}
        </dt>
        <dd class="t13">
          <abbr
            v-if="emFoco?.orgao?.sigla"
            :title="emFoco?.orgao?.descricao"
          >
            {{ emFoco.orgao.sigla }}
          </abbr>
          <template v-else>
            {{ emFoco?.orgao }}
          </template>
        </dd>
      </div>
      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.modalidade_contratacao_id.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.modalidade_contratacao?.nome || emFoco?.modalidade_contratacao || '-' }}
        </dd>
      </div>
      <div class="f1 fb25em mbi">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.data_termino.spec.label }}
        </dt>
        <dd>
          {{ emFoco?.data_termino ? dateToShortDate(emFoco.data_termino) : '-' }}
        </dd>
      </div>
      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.fontes_recurso.spec.label }}
        </dt>
        <dd class="t13 contentStyle">
          <ul v-if="emFoco?.fontes_recurso?.length">
            <li
              v-for="fonte, i in emFoco?.fontes_recurso"
              :key="i"
            >
              {{ fonte.fonte_recurso_cod_sof }}
              ({{ fonte.fonte_recurso_ano }})
            </li>
          </ul>
        </dd>
      </div>
      <div class="f1 fb100 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.objeto_resumo.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.objeto_resumo || '-' }}
        </dd>
      </div>
      <div class="f1 fb100 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.objeto_detalhado.spec.label }}
        </dt>
        <dd
          class="t13 contentStyle"
          v-html="emFoco?.objeto_detalhado"
        />
      </div>

      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.contratante.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.contratante || '-' }}
        </dd>
      </div>
      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.empresa_contratada.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.empresa_contratada || '-' }}
        </dd>
      </div>
      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.cnpj_contratada.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.cnpj_contratada || '-' }}
        </dd>
      </div>
      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.data_assinatura.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.data_assinatura
            ? dateToShortDate(emFoco.data_assinatura)
            : '-' }}
        </dd>
      </div>
      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.prazo_numero.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.prazo_numero }} {{ emFoco?.prazo_unidade }}
        </dd>
      </div>
      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.data_base_mes.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.data_base_mes || '-' }}/{{ emFoco?.data_base_ano || '-' }}
        </dd>
      </div>
      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.data_inicio.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.data_inicio ? dateToShortDate(emFoco.data_inicio) : '-' }}
        </dd>
      </div>
      <div class="f1 fb25em mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.valor.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.valor ? `R$ ${dinheiro(emFoco?.valor)}` : '-' }}
        </dd>
      </div>
      <div class="f1 fb100 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Aditivos
        </dt>
        <dd>
          <ContratosAditivos
            @salvo="contratosStore.buscarItem(emFoco.id)"
            @excluido="contratosStore.buscarItem(emFoco.id)"
          />
        </dd>
      </div>
      <div class="f1 fb100 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.observacoes.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.observacoes || '-' }}
        </dd>
      </div>
    </dl>

    <LoadingComponent v-if="chamadasPendentes?.emFoco" />

    <ErrorComponent v-if="erro">
      {{ erro }}
    </ErrorComponent>
  </div>
</template>
