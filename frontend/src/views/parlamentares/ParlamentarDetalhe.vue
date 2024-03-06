<template>
  <h1>Parlamentar</h1>
  <div>
    <div class="flex g2 mb1 flexwrap">
      <img
        class="carometro__img"
        :src="emFoco.foto"
      >
      <div>
        <dl
          class="f1 mb1"
        >
          <dt class="t12 uc w700 mb05 ">
            Nome Civil
          </dt>
          <dd
            v-if="emFoco"
            class="t13"
          >
            {{ emFoco.nome }}
          </dd>
        </dl>
        <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Nome
          </dt>
          <dd
            v-if="emFoco"
            class="t13"
          >
            {{ emFoco.nome_popular }}
          </dd>
        </dl>
        <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Aniversário
          </dt>
          <dd
            v-if="emFoco"
            class="t13"
          >
            {{ new Date(emFoco.nascimento).toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' }) }}
          </dd>
        </dl>
        <!-- <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Telefone:
          </dt>
          <dd class="t13">
            {{ emFoco.telefone }}
          </dd>
        </dl> -->
      </div>
    </div>

    <div class="flex spacebetween center mb2">
      <hr class="ml2 f1">
      <h4>Assessores</h4>
      <hr class="ml2 f1">
    </div>
    <!-- iterar emFoco.assessores ou  equipe -->
    <div class="flex spacebetween center mb2">
      <dl
        class="f1 mb1"
      >
        <dt class="t12 uc w700 mb05 ">
          Nome
        </dt>
        <dd
          v-if="emFoco"
          class="t13"
        >
          {{ emFoco.nome }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 ">
          Telefone
        </dt>
        <dd
          v-if="emFoco"
          class="t13"
        >
          {{ emFoco.nome_popular }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 ">
          E-mail
        </dt>
        <dd
          v-if="emFoco"
          class="t13"
        >
          {{ new Date(emFoco.nascimento).toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' }) }}
        </dd>
      </dl>
    </div>
  </div>
</template>

<script setup>
import { useParlamentaresStore } from '@/stores/parlamentares.store';
// import { parlamentar as schema } from '@/consts/formSchemas';

import { onMounted, ref } from 'vue';

const props = defineProps({
  parlamentarId: {
    type: Number,
    default: 0,
  },
});

const parlamentaresStore = useParlamentaresStore();

const emFoco = ref(null);
onMounted(async () => {
  await parlamentaresStore.buscarItem(props.parlamentarId);
  emFoco.value = parlamentaresStore.emFoco;
  console.log('emFoco: ', emFoco);
});

</script>

<style scoped lang="less">
.carometro{
  &__img{
  max-width: 280px;
  border-radius: 10px;
  }
}
</style>
