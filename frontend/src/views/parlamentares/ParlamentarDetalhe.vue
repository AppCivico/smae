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
        <dl
          v-if="emFoco.mandato_atual?.suplencia"
          class="f1 mb1"
        >
          <dt class="t12 uc w700 mb05 ">
            Suplência
          </dt>
          <dd
            v-if="emFoco"
            class="t13"
          >
            {{ níveisDeSuplência[emFoco.mandato_atual?.suplencia]?.nome }}
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

        <dl
          v-if="emFoco.mandato_atual?.atuacao"
          class="f1 mb1"
        >
          <dt class="t12 uc w700 mb05 ">
            Atuação
          </dt>
          <dd class="t13">
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
              v-if="emFoco.mandato_atual?.cargo"
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
              v-if="emFoco.mandato_atual?.partido_atual.sigla"
              class="t13"
            >
              {{ emFoco.mandato_atual.partido_atual.sigla }}
            </dd>
          </dl>
          <dl class="f1 mb1">
            <dt class="t12 uc w700 mb05 ">
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
            v-if="emFoco.mandato_atual?.votos_interior"
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
            v-if="emFoco.mandato_atual?.votos_capital"
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
            v-if="emFoco.mandato_atual?.endereco"
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
            v-if="emFoco.mandato_atual?.gabinete"
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
            v-if="emFoco.mandato_atual?.email"
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

    <div class="mb2">
      <div class="flex spacebetween center mb2">
        <h3 class="c500">
          Representatividade na Capital
        </h3>
        <hr class="ml2 f1">
      </div>
      <table class="tablemain">
        <col>
        <col>
        <col>
        <col>
        <col>
        <col>
        <thead>
          <tr>
            <th> Ranking na Capital </th>
            <th>Município/Subprefeitura</th>
            <th>Região</th>
            <th>Votos nominais do candidato </th>
            <th>Quantidade de Comparecimento</th>
            <th>Porcentagem do candidato</th>
            <!-- <th></th> v-if can edit -->
          </tr>
        </thead>
        <tbody v-if="representatividadeCapital.length">
          <tr
            v-for="item in representatividadeCapital"
            :key="item.id"
          >
            <td>{{ item.id }}</td>
            <td>{{ item.municipio_tipo }}</td>
            <td>{{ item.regiao.codigo }}</td>
            <td>{{ item.numero_votos }}</td>
            <td>{{ item.regiao.comparecimento.valor }}</td>
            <td>{{ item.pct_participacao }}</td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="3">
              Nenhuma representatividade na Capital encontrada.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mb2">
      <div class="flex spacebetween center mb2">
        <h3 class="c500">
          Representatividade no Interior
        </h3>
        <hr class="ml2 f1">
      </div>
      <table class="tablemain">
        <col>
        <col>
        <col>
        <col>
        <col>
        <col>
        <thead>
          <tr>
            <th>Ranking no Interior</th>
            <th>Município/Subprefeitura</th>
            <th>Região</th>
            <th>Votos nominais do candidato</th>
            <th>Quantidade de Comparecimento</th>
            <th>Porcentagem do candidato</th>
          </tr>
        </thead>
        <tbody v-if="representatividadeInterior.length">
          <tr
            v-for="item in representatividadeInterior"
            :key="item.id"
          >
            <td>{{ item.id }}</td>
            <td>{{ item.municipio_tipo }}</td>
            <td>{{ item.regiao.codigo }}</td>
            <td>{{ item.numero_votos }}</td>
            <td>{{ item.regiao.comparecimento.valor }}</td>
            <td>{{ item.pct_participacao }}</td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6">
              Nenhuma representatividade no Interior encontrada.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="mb2">
    <div class="flex spacebetween center mb2">
      <h3 class="c500">
        Suplentes
      </h3>
      <hr class="ml2 f1">
    </div>
    <table class="tablemain">
      <col>
      <col>
      <col>
      <col>
      <col>
      <thead>
        <tr>
          <th>Ordem</th>
          <th>ID do Parlamentar</th>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody v-if="suplentes.length">
        <tr
          v-for="(suplente, index) in suplentes"
          :key="suplente.id"
        >
          <td>{{ index === 0 ? '1º' : '2º' }}</td>
          <td>{{ suplente.parlamentar.id }}</td>
          <td>{{ suplente.parlamentar.nome }}</td>
          <td>{{ suplente.parlamentar.telefone }}</td>
          <td>{{ suplente.parlamentar.email }}</td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="5">
            Nenhum suplente encontrado.
          </td>
        </tr>
      </tbody>
    </table>
    <button
      class="like-a__text addlink"
      type="button"
      @click="abrirModalSuplentes"
    >
      <svg
        width="20"
        height="20"
      >
        <use xlink:href="#i_+" />
      </svg>
      Adicionar suplente
    </button>
  </div>
  <!-- TODO: só pode aparecer se tiver mandato criado -->
  <ParlamentaresSuplentes
    v-if="showSuplentesModal"
    apenas-emitir="true"
    :parlamentar-id="emFoco.id"
    :mandato-id="emFoco?.mandato_atual?.id"
    @close="() => {
      showSuplentesModal = false;
      parlamentaresStore.buscarItem(props.parlamentarId);
    }"
  />
</template>

<script setup>
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { computed, onMounted, ref } from 'vue';
import níveisDeSuplência from '@/consts/niveisDeSuplencia';
import ParlamentaresSuplentes from './ParlamentaresSuplentes.vue';

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
const representatividade = computed(() => emFoco.value?.mandato_atual?.representatividade ?? []);

const assessores = computed(() => equipe.value.filter((item) => item.tipo === 'Assessor'));
const contatos = computed(() => equipe.value.filter((item) => item.tipo === 'Contato'));

const representatividadeCapital = computed(() => representatividade.value.filter((item) => item.municipio_tipo === 'Capital'));
const representatividadeInterior = computed(() => representatividade.value.filter((item) => item.municipio_tipo === 'Interior'));

const suplentes = computed(() => emFoco.value?.mandato_atual?.suplentes ?? []);

const showSuplentesModal = ref(false);

const abrirModalSuplentes = () => {
  showSuplentesModal.value = true;
};
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
