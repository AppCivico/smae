<template>
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
        <dl>
          <dt>
            Nome Civil
          </dt>
          <dd v-if="emFoco">
            {{ emFoco.nome }}
          </dd>
        </dl>

        <dl
          v-if="emFoco.mandato_atual?.suplencia"
        >
          <dt>
            Suplência
          </dt>
          <dd v-if="emFoco">
            {{ níveisDeSuplência[emFoco.mandato_atual?.suplencia]?.nome }}
          </dd>
        </dl>

        <dl>
          <dt>
            Nome
          </dt>
          <dd
            v-if="emFoco"
            class="t13"
          >
            {{ emFoco.nome_popular }}
          </dd>
        </dl>

        <dl>
          <dt>
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
          v-if="emFoco.telefone && authStore.temPermissãoPara('SMAE.acesso_telefone') "
        >
          <dt>
            Telefone
          </dt>
          <dd>
            {{ emFoco.telefone }}
          </dd>
        </dl>

        <dl
          v-if="emFoco.mandato_atual?.atuacao"
        >
          <dt>
            Área de Atuação
          </dt>
          <dd>
            {{ emFoco.mandato_atual.atuacao }}
          </dd>
        </dl>
      </div>
    </div>
    <div v-if="emFoco.mandato_atual?.biografia">
      <div class="flex spacebetween center mb2">
        <h3 class="c500">
          Biografia
        </h3>
        <hr class="ml2 f1">
      </div>
      <p>
        {{ emFoco.mandato_atual.biografia }}
      </p>
    </div>

    <div class="mb2">
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

    <div
      v-if="emFoco.mandato_atual?.eleicao"
      class="mb2"
    >
      <div class="flex spacebetween center mb2">
        <h3 class="c500">
          Eleição {{ emFoco.mandato_atual.eleicao.ano }}
        </h3>
        <hr class="ml2 f1">
      </div>

      <div class="flex spacebetween center mb2">
        <div>
          <dl>
            <dt>
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

          <dl>
            <dt>
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

          <dl>
            <dt>
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
          <dl>
            <dt>
              UF
            </dt>
            <dd
              v-if="emFoco.mandato_atual"
              class="t13"
            >
              {{ emFoco.mandato_atual.uf }}
            </dd>
          </dl>

          <dl>
            <dt>
              Cargo
            </dt>
            <dd
              v-if="emFoco.mandato_atual?.cargo"
              class="t13"
            >
              {{ emFoco.mandato_atual.cargo }}
            </dd>
          </dl>
        </div>

        <div>
          <dl>
            <dt>
              Partido Atual
            </dt>
            <dd
              v-if="emFoco.mandato_atual?.partido_atual.sigla"
              class="t13"
            >
              {{ emFoco.mandato_atual.partido_atual.sigla }}
            </dd>
          </dl>
          <dl>
            <dt>
              Partido - Candidatura
            </dt>
            <dd
              v-if="emFoco.mandato_atual?.partido_candidatura.sigla"
              class="t13"
            >
              {{ emFoco.mandato_atual.partido_candidatura.sigla }}
            </dd>
          </dl>
        </div>
        <div>
          <dl
            v-if="emFoco.mandato_atual?.votos_estado"
          >
            <dt>
              Votos no Estado
            </dt>
            <dd
              class="t13"
            >
              {{ emFoco.mandato_atual.votos_estado }}
            </dd>
          </dl>

          <dl
            v-if="emFoco.mandato_atual?.votos_interior"
          >
            <dt>
              Votos no interior
            </dt>
            <dd

              class="t13"
            >
              {{ emFoco.mandato_atual.votos_interior }}
            </dd>
          </dl>

          <dl
            v-if="emFoco.mandato_atual?.votos_capital"
          >
            <dt>
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
        <dl>
          <dt>
            Endereço
          </dt>
          <dd
            v-if="emFoco.mandato_atual?.endereco"
            class="t13"
          >
            {{ emFoco.mandato_atual.endereco }}
          </dd>
        </dl>

        <dl>
          <dt>
            Gabinete
          </dt>
          <dd
            v-if="emFoco.mandato_atual?.gabinete"
            class="t13"
          >
            {{ emFoco.mandato_atual.gabinete }}
          </dd>
        </dl>

        <dl>
          <dt>
            Email
          </dt>
          <dd
            v-if="emFoco.mandato_atual?.email"
            class="t13"
          >
            {{ emFoco.mandato_atual.email }}
          </dd>
        </dl>
      </div>
    </div>

    <div class="mb2">
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

    <ParlamentaresExibirRepresentatividade />
  </div>

  <ParlamentarExibirSuplentes />
</template>

<script setup>
import ParlamentaresExibirRepresentatividade from '@/components/parlamentares/ParlamentaresExibirRepresentatividade.vue';
import ParlamentarExibirSuplentes from '@/components/parlamentares/ParlamentarExibirSuplentes.vue';
import níveisDeSuplência from '@/consts/niveisDeSuplencia';
import { useAuthStore } from '@/stores/auth.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
  parlamentarId: {
    type: Number,
    default: 0,
  },
});

const authStore = useAuthStore();
const parlamentaresStore = useParlamentaresStore();

const emFoco = ref({});
onMounted(async () => {
  await parlamentaresStore.buscarItem(props.parlamentarId);
  emFoco.value = parlamentaresStore.emFoco;
});

const equipe = computed(() => emFoco.value?.equipe ?? []);
const representatividade = computed(() => emFoco.value?.mandato_atual?.representatividade ?? []);

const assessores = computed(() => equipe.value.filter((item) => item.tipo === 'Assessor'));
const contatos = computed(() => equipe.value.filter((item) => item.tipo === 'Contato'));

const representatividadeCapital = computed(() => representatividade.value.filter((item) => item.municipio_tipo === 'Capital'));
const representatividadeInterior = computed(() => representatividade.value.filter((item) => item.municipio_tipo === 'Interior'));
</script>

<style scoped lang="less">

.carometro {

}

.carometro__img-container {
  width: 280px;
  height: 280px;
  border-radius: 10px;
  background-color: #F7F7F7;
  border: 6px solid #F7C234;
}

.carometro__img {
  width: 100%;
}

.carometro__equipe {
  max-width: 890px;
  margin: 0 auto;
}

dt{
  color: #607A9F;
  font-weight: 700;
  font-size: 24px;
}

dd {
  font-weight: 400;
  color: #233B5C;
  font-size: 20px;
  margin-bottom: 15px;
}

</style>
