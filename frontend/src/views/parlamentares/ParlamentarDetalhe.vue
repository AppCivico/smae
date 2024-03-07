<template>
  <!-- TODO: pegar <dt></dt> do  schema-->
  <h1>Parlamentar</h1>
  <div>
    <div class="flex g2 mb1 flexwrap">
      <div class="carometro__img-container">
        <img
          v-if="emFoco.image"
          class="carometro__img"
          :src="emFoco.image"
        >
      </div>
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
    <div v-if="emFoco.biografia">
      <div class="flex spacebetween center mb2">
        <h3 class="c500">
          Biografia
        </h3>
        <hr class="ml2 f1">
      </div>
      <p>
        {{ emFoco.biografia }}
      </p>
    </div>

    <div class=" mb2">
      <div class="flex spacebetween center mb2">
        <h3 class="c500">
          Assessores
        </h3>
        <hr class="ml2 f1">
      </div>
      <table class="tablemain ">
        <col>
        <col>
        <col>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>E-mail</th>
          </tr>
        </thead>
        <tbody v-if="assessores.length">
          <tr
            v-for="assessor in assessores"
            :key="assessor.id"
          >
            <td>{{ assessor.nome }}</td>
            <td>{{ assessor.telefone }}</td>
            <td>{{ assessor.email }}</td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="3">
              Nenhum assessor encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="emFoco.mandato_atual">
      <div class="flex spacebetween center mb2">
        <h3 class="c500">
          Eleição {{ emFoco.mandato_atual.eleicao.ano }}
        </h3>
        <hr class="ml2 f1">
      </div>

      <div class="flex spacebetween center mb2">
        <div>
          <dl class="f1 mb1">
            <dt class="t12 uc w700 mb05 ">
              Eleito
            </dt>
            <dd
              v-if="emFoco"
              class="t13"
            >
              <span v-if="emFoco.mandato_atual.eleito">Sim</span>
              <span v-else>Não</span>
            </dd>
          </dl>

          <dl class="f1 mb1">
            <dt class="t12 uc w700 mb05 ">
              Suplente
            </dt>
            <dd
              v-if="emFoco"
              class="t13"
            >
              <span v-if="emFoco.mandato_atual.suplencia">Sim</span>
              <span v-else>Não</span>
            </dd>
          </dl>

          <dl class="f1 mb1">
            <dt class="t12 uc w700 mb05 ">
              Em atividade?
            </dt>
            <dd
              v-if="emFoco"
              class="t13"
            >
              <span v-if="emFoco.em_atividade">Sim</span>
              <span v-else>Não</span>
            </dd>
          </dl>
        </div>

        <div>
          <dl class="f1 mb1">
            <dt class="t12 uc w700 mb05 ">
              UF
            </dt>
            <dd
              v-if="emFoco.mandato_atual"
              class="t13"
            >
              {{ emFoco.mandato_atual.uf }}
            </dd>
          </dl>

          <dl class="f1 mb1">
            <dt class="t12 uc w700 mb05">
              Cargo
            </dt>
            <dd
              v-if="emFoco.mandato_atual"
              class="t13"
            >
              {{ emFoco.mandato_atual.cargo }}
            </dd>
          </dl>
        </div>

        <div>
          <dl class="f1 mb1">
            <dt class="t12 uc w700 mb05 ">
              Partido Atual
            </dt>
            <dd
              v-if="emFoco.mandato_atual"
              class="t13"
            >
              {{ emFoco.mandato_atual.partido_atual.sigla }}
            </dd>
          </dl>

          <!-- pedir bancada -->
          <!-- <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Bancada Atual
          </dt>
          <dd
            v-if="emFoco.mandato_atual"
            class="t13"
          >
            {{ emFoco.mandato_atual.bancada }}
          </dd>
        </dl> -->

          <dl class="f1 mb1">
            <dt class="t12 uc w700 mb05 ">
              Partido - Candidatura
            </dt>
            <dd
              v-if="emFoco.mandato_atual"
              class="t13"
            >
              {{ emFoco.mandato_atual.partido_candidatura.sigla }}
            </dd>
          </dl>
        </div>
        <!-- como tratar quqnaodn n tem essas infos?-->
        <div>
          <dl
            v-if="emFoco.mandato_atual.votos_estado"
            class="f1 mb1"
          >
            <dt class="t12 uc w700 mb05 ">
              Votos no Estado
            </dt>
            <dd
              class="t13"
            >
              {{ emFoco.mandato_atual.votos_estado }}
            </dd>
          </dl>

          <dl
            v-if="emFoco.mandato_atual.votos_interior"
            class="f1 mb1"
          >
            <dt class="t12 uc w700 mb05 ">
              Votos no interior
            </dt>
            <dd

              class="t13"
            >
              {{ emFoco.mandato_atual.votos_interior }}
            </dd>
          </dl>

          <dl
            v-if="emFoco.mandato_atual.votos_capital"
            class="f1 mb1"
          >
            <dt class="t12 uc w700 mb05 ">
              Votos na capital
            </dt>
            <dd
              class="t13"
            >
              {{ emFoco.mandato_atual.votos_capital }}
            </dd>
          </dl>
        </div>
      </div>

      <div>
        <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Endereço
          </dt>
          <dd
            v-if="emFoco.mandato_atual"
            class="t13"
          >
            {{ emFoco.mandato_atual.endereco }}
          </dd>
        </dl>

        <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Gabinete
          </dt>
          <dd
            v-if="emFoco.mandato_atual"
            class="t13"
          >
            {{ emFoco.mandato_atual.gabinete }}
          </dd>
        </dl>

        <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Email
          </dt>
          <dd
            v-if="emFoco.mandato_atual"
            class="t13"
          >
            {{ emFoco.mandato_atual.email }}
          </dd>
        </dl>
        <!-- pedir email e telefone -->
        <!-- <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Email
          </dt>
          <dd
            v-if="emFoco.mandato_atual"
            class="t13"
          >
            {{ emFoco.mandato_atual.email }}
          </dd>
        </dl>

        <dl class="f1 mb1">
          <dt class="t12 uc w700 mb05 ">
            Telefone
          </dt>
          <dd
            v-if="emFoco.mandato_atual"
            class="t13"
          >
            {{ emFoco.mandato_atual.telefone }}
          </dd>
        </dl> -->
      </div>
    </div>

    <div class=" mb2">
      <div class="flex spacebetween center mb2">
        <h3 class="c500">
          Contatos
        </h3>
        <hr class="ml2 f1">
      </div>
      <table class="tablemain ">
        <col>
        <col>
        <col>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>E-mail</th>
          </tr>
        </thead>
        <tbody v-if="contatos.length">
          <tr
            v-for="contato in contatos"
            :key="contato.id"
          >
            <td>{{ contato.nome }}</td>
            <td>{{ contato.telefone }}</td>
            <td>{{ contato.email }}</td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="3">
              Nenhum contato encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
});

const equipe = computed(() => emFoco.value?.equipe ?? []);

const assessores = computed(() => equipe.value.filter((item) => item.tipo === 'Assessor'));

const contatos = computed(() => equipe.value.filter((item) => item.tipo === 'Contato'));
</script>

<style scoped lang="less">
.carometro{
  &__img-container{
    width: 280px;
    height:280px;
    border-radius: 10px;
    background-color: #F7F7F7;
    border: 6px solid #F7C234;
    ;
  }
  &__img{
   width: 100%;
  }

  &__equipe{
    max-width: 890px;
    margin: 0 auto;
  }
}
</style>
