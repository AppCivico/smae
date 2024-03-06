<template>
  <!-- -  {{ emFoco }} - -->
  <!-- TODO: pegar <dt></dt> do  schema-->
  <h1>Parlamentar</h1>
  <div>
    <div class="flex g2 mb1 flexwrap">
      <!-- <img

        class="carometro__img"
        src="/home/gio/Downloads/image.png"
      > -->
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

        <!-- TODO: ver como acessar o emFoco.telefone -->
        <dl
          v-if="emFoco.telefone"
          class="f1 mb1"
        >
          <dt class="t12 uc w700 mb05 ">
            Telefone:
          </dt>
          <dd class="t13">
            {{ emFoco.telefone }}
          </dd>
        </dl>

        <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Atuação
          </dt>
          <dd
            v-if="emFoco"
            class="t13"
          >
            {{ emFoco.atuacao }}
          </dd>
        </dl>
      </div>
    </div>

    <div class="flex spacebetween center mb2">
      <h1>Biografia</h1>
      <hr class="ml2 f1">
    </div>
    <div v-if="emFoco">
      <!-- {{ emFoco.biografia }} -->
      TEXTOTEXTOTEXTOTEXTO TEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTO TEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTO TEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTOTEXTO
    </div>
    <div class="flex spacebetween center mb2">
      <h1>Assessores</h1>
      <hr class="ml2 f1">
    </div>
    <table class="tablemain">
      <colgroup>
        <col>
        <col>
        <col>
      </colgroup>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Telefone</th>
          <th>E-mail</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="assessores.length">
          <tr
            v-for="assessor in assessores"
            :key="assessor.id"
          >
            <td>{{ assessor.nome }}</td>
            <td>{{ assessor.telefone }}</td>
            <td>{{ assessor.email }}</td>
          </tr>
        </template>
        <tr v-else>
          <td colspan="3">
            Nenhum assessor encontrado.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useParlamentaresStore } from '@/stores/parlamentares.store';
// import { parlamentar as schema } from '@/consts/formSchemas';

import { onMounted, ref, computed } from 'vue';

const props = defineProps({
  parlamentarId: {
    type: Number,
    default: 0,
  },
});

const parlamentaresStore = useParlamentaresStore();

const emFoco = ref({});
onMounted(async () => {
  await parlamentaresStore.buscarItem(props.parlamentarId);
  emFoco.value = parlamentaresStore.emFoco;
  console.log('emFoco: ', emFoco);
});

const assessores = computed(() => {
  if (!emFoco.value || !emFoco.value.equipe) return [];
  return emFoco.value.equipe.filter((item) => item.tipo === 'Assessor');
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
