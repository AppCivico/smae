<script setup>
import { liçãoAprendida as schema } from '@/consts/formSchemas';
import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { storeToRefs } from 'pinia';

const licoesAprendidasStore = useLiçõesAprendidasStore();
const riscosStore = useRiscosStore();

const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(licoesAprendidasStore);
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      {{ typeof route?.meta?.título === 'function'
        ? route.meta.título()
        : route?.meta?.título || 'Resumo de lição aprendida' }}
    </h1>

    <hr class="ml2 f1">

    <router-link
      v-if="emFoco?.id"
      :to="{
        name: 'liçõesAprendidasEditar', params: {
          licaoAprendidaId: emFoco.id,
          projetoId: Number.parseInt($route.params.projetoId, 10) || undefined,
        }
      }"
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
          {{ schema.fields.responsavel.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.responsavel || '-' }}
        </dd>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.contexto.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.contexto || '-' }}
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
          {{ schema.fields.resultado.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.resultado || '-' }}
        </dd>
      </div>
    </div>
    
    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.observacao.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.observacao || '-' }}
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
