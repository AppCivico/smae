<script setup>
import { processo as schema } from '@/consts/formSchemas';
import formatProcesso from '@/helpers/formatProcesso';
import { storeToRefs } from 'pinia';
import { useProcessosStore } from '@/stores/processos.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';

const processosStore = useProcessosStore();
const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(processosStore);

const projetosStore = useProjetosStore();
const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Resumo de processo SEI
    </TítuloDePágina>

    <hr class="ml2 f1">

    <router-link
      v-if="emFoco?.id
        && (!permissõesDoProjetoEmFoco.apenas_leitura
          || permissõesDoProjetoEmFoco.sou_responsavel)"
      :to="{
        name: 'processosEditar',
        params: $route.params
      }"
      title="Editar processo"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>

  <div
    v-if="emFoco"
    class="boards"
  >
    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.processo_sei.spec.label }}
        </dt>
        <dd class="t13">
          <a
            :href="emFoco?.link"
            target="_blank"
          >
            {{ emFoco?.processo_sei ? formatProcesso(emFoco?.processo_sei) : '-' }}
          </a>
        </dd>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.descricao.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.descricao || '-' }}
        </dd>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.comentarios.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.comentarios || '-' }}
        </dd>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.observacoes.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.observacoes || '-' }}
        </dd>
      </div>
    </div>
  </div>

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
</template>
