<script setup>
import { liçãoAprendida as schema } from '@/consts/formSchemas';
import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';

const licoesAprendidasStore = useLiçõesAprendidasStore();
const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(licoesAprendidasStore);

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
      Resumo de lição aprendida
    </TítuloDePágina>

    <hr class="ml2 f1">

    <router-link
      v-if="emFoco?.id
        && (!permissõesDoProjetoEmFoco.apenas_leitura
          || permissõesDoProjetoEmFoco.sou_responsavel)"
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
