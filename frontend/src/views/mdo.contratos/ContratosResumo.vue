<script setup>
import { contratoDeObras as schema } from '@/consts/formSchemas';
import formatProcesso from '@/helpers/formatProcesso';
import { useObrasStore } from '@/stores/obras.store';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { storeToRefs } from 'pinia';
import { defineOptions } from 'vue';

defineOptions({ inheritAttrs: false });

const processosStore = useContratosStore();
const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(processosStore);

const obrasStore = useObrasStore();
const {
  permissõesDaObraEmFoco,
} = storeToRefs(obrasStore);
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Resumo de contrato
    </TítuloDePágina>

    <hr class="ml2 f1">

    <router-link
      v-if="emFoco?.id
        && (!permissõesDaObraEmFoco.apenas_leitura
          || permissõesDaObraEmFoco.sou_responsavel)"
      :to="{
        name: 'contratosDaObraEditar',
        params: $route.params
      }"
      title="Editar contrato"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>

  <div
    v-if="emFoco"
    class="boards"
  >
    <div class="flex">
      <div class="flex g2 f1">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.numero.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.numero || '-' }}
          </dd>
        </div>
      </div>
      <div class="flex g2 f1">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.contrato_exclusivo.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.contrato_exclusivo ? 'Sim' : 'Não' }}
          </dd>
        </div>
      </div>
      <div class="flex g2 f1">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.numero.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.status || '-' }}
          </dd>
        </div>
      </div>
    </div>

    <div class="flex">
      <div class="flex g2 f1">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.processos_sei.spec.label }}
          </dt>
          <dd class="t13">
            <div
              v-for="processoSei in emFoco?.processos_sei"
              :key="processoSei"
            >
              {{ processoSei }}
            </div>
          </dd>
        </div>
      </div>
      <div class="flex g2 f1">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.modalidade_contratacao_id.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.modalidade_contratacao_id }}
          </dd>
        </div>
      </div>
      <div class="flex g2 f1">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.fontes_recurso_ids.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.fontes_recurso_ids }}
          </dd>
        </div>
      </div>
    </div>

    <div><h2>IMPLEMENTAR ADITIVOS!!</h2></div>

    <div
      v-if="chamadasPendentes?.emFoco"
      class="spinner"
    >
      Carregando
    </div>

    <div
      v-if="erro"
      class="error p1"
    >
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </div>
</template>
