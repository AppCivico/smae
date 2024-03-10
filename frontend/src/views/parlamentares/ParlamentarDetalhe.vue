<template>
  <div class="flex spacebetween center mb2">
    <h1>Parlamentar</h1>
    <hr class="ml2 f1">

    <router-link
      v-if="emFoco?.id && authStore.temPermissãoPara('SMAE.acesso_telefone')"
      :to="{ name: 'parlamentaresEditar', params: { parlamentarId: emFoco.id } }"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>
  <div>
    <div class="flex g2 mb1 flexwrap">
      <div class="carometro__img-container">
        <img
          v-if="emFoco.foto"
          class="carometro__img"
          :src="`${baseUrl}/download/${emFoco.foto}?inline=true`"
        >
      </div>
      <div>
        <dl>
          <dt>
            Nome
          </dt>
          <dd v-if="emFoco">
            {{ emFoco.nome_popular }}
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

        <!-- <dl
          v-if="emFoco.mandato_atual?.suplencia"
        >
          <dt>
            Suplência
          </dt>
          <dd v-if="emFoco">
            {{ níveisDeSuplência[emFoco.mandato_atual?.suplencia]?.nome }}
          </dd>
        </dl> -->
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

        <dl>
          <dt>
            Aniversário
          </dt>
          <dd v-if="emFoco">
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
      </div>
    </div>
    <div v-if="emFoco.mandato_atual?.biografia">
      <div class="flex spacebetween center mb2">
        <h3 class="title">
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
        <h3 class="title">
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
        <h3 class="title">
          Eleição {{ emFoco.mandato_atual.eleicao.ano }}
        </h3>
        <hr class="ml2 f1">
      </div>

      <div class="eleicao">
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
            <dd v-if="emFoco.mandato_atual?.cargo">
              {{ emFoco.mandato_atual.cargo }}
            </dd>
          </dl>
        </div>

        <div>
          <dl>
            <dt>
              Partido Atual
            </dt>
            <dd v-if="emFoco.mandato_atual?.partido_atual.sigla">
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

        <div v-if="emFoco.mandato_atual?.votos_estado || emFoco.mandato_atual?.votos_interior || emFoco.mandato_atual?.votos_capital">
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
            >
              {{ emFoco.mandato_atual.gabinete }}
            </dd>
          </dl>

          <dl v-if="emFoco.mandato_atual?.email">
            <dt>
              Email
            </dt>
            <dd>
              {{ emFoco.mandato_atual.email }}
            </dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="mb2">
      <div class="flex spacebetween center mb2">
        <h3 class="title">
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
import { useAuthStore } from '@/stores/auth.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { computed, onMounted, ref } from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

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

const assessores = computed(() => equipe.value.filter((item) => item.tipo === 'Assessor'));
const contatos = computed(() => equipe.value.filter((item) => item.tipo === 'Contato'));

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
  overflow: hidden;
}

.carometro__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carometro__equipe {
  max-width: 890px;
  margin: 0 auto;
}

dt,
.title{
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
.eleicao {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.eleicao > div {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 20px;
  border-top: solid 2px #B8C0CC;
  border-radius: 12px;
}
</style>
