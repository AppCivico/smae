<template>
  <div class="flex spacebetween center mb2">
    <h1>Parlamentar</h1>
    <hr class="ml2 f1">

    <router-link
      v-if="emFoco?.id && authStore.temPermissãoPara('CadastroParlamentar.editar')"
      :to="{ name: 'parlamentaresEditar', params: { parlamentarId: emFoco.id } }"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>
  <div>
    <div class="carometro__cabeçalho mb1">
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
          v-if="emFoco.ultimo_mandato?.atuacao"
        >
          <dt>
            Área de Atuação
          </dt>
          <dd v-html="emFoco.ultimo_mandato.atuacao" />
        </dl>
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
          <dd v-if="emFoco.nascimento">
            {{ emFoco.nascimento ? emFoco.nascimento.split('T')[0].split('-').reverse().join('/').slice(0, 5) : '' }}
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

    <div
      v-if="emFoco.ultimo_mandato"
      class="mb4"
    >
      <div
        v-if="emFoco.ultimo_mandato?.biografia"
        class="flex spacebetween center"
      >
        <h3 class="title">
          Biografia
        </h3>
        <hr class="ml2 f1">
      </div>

      <div
        class="biografia"
        v-html="emFoco.ultimo_mandato.biografia"
      />

      <div class="mb4 mt2">
        <div class="flex spacebetween center">
          <h3 class="title">
            Assessores / Contatos
          </h3>
          <hr class="ml2 f1">
        </div>
        <table class="tablemain ">
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
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody v-if="emFoco.equipe.length">
            <tr
              v-for="(item, index) in emFoco.equipe"
              :key="index"
            >
              <td>{{ item.nome }}</td>
              <td>{{ item.telefone }}</td>
              <td>{{ item.email }}</td>
              <td>{{ item.tipo }}</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="3">
                Nenhum assessor/contato encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="emFoco.ultimo_mandato?.eleicao"
        class="mb4"
      >
        <div class="flex spacebetween center">
          <h3 class="title">
            Eleição {{ emFoco.ultimo_mandato.eleicao.ano }}
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
                <span v-if="emFoco.ultimo_mandato.eleito">Sim</span>
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
                <span v-if="emFoco.ultimo_mandato.suplencia">Sim</span>
                <span v-else>Não</span>
              </dd>
            </dl>

            <dl>
              <dt>
                Em exercício?
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
                v-if="emFoco.ultimo_mandato"
                class="t13"
              >
                {{ emFoco.ultimo_mandato.uf }}
              </dd>
            </dl>

            <dl>
              <dt>
                Cargo
              </dt>
              <dd v-if="emFoco.ultimo_mandato?.cargo">
                {{ emFoco.ultimo_mandato.cargo }}
              </dd>
            </dl>
          </div>

          <div>
            <dl>
              <dt>
                Partido Atual
              </dt>
              <dd v-if="emFoco.ultimo_mandato?.partido_atual.sigla">
                {{ emFoco.ultimo_mandato.partido_atual.sigla }}
              </dd>
            </dl>
            <dl>
              <dt>
                Partido - Candidatura
              </dt>
              <dd
                v-if="emFoco.ultimo_mandato?.partido_candidatura.sigla"
                class="t13"
              >
                {{ emFoco.ultimo_mandato.partido_candidatura.sigla }}
              </dd>
            </dl>
          </div>

          <div v-if="emFoco.ultimo_mandato?.votos_estado || emFoco.ultimo_mandato?.votos_interior || emFoco.ultimo_mandato?.votos_capital">
            <dl
              v-if="emFoco.ultimo_mandato?.votos_estado"
            >
              <dt>
                Votos no Estado
              </dt>
              <dd
                class="t13"
              >
                {{ formatarNumero(emFoco.ultimo_mandato.votos_estado) }}
              </dd>
            </dl>

            <dl
              v-if="emFoco.ultimo_mandato?.votos_interior"
            >
              <dt>
                Votos no interior
              </dt>
              <dd

                class="t13"
              >
                {{ formatarNumero(emFoco.ultimo_mandato.votos_interior) }}
              </dd>
            </dl>

            <dl
              v-if="emFoco.ultimo_mandato?.votos_capital"
            >
              <dt>
                Votos na capital
              </dt>
              <dd
                class="t13"
              >
                {{ formatarNumero(emFoco.ultimo_mandato.votos_capital) }}
              </dd>
            </dl>
          </div>

          <div>
            <dl>
              <dt>
                Endereço
              </dt>
              <dd
                v-if="emFoco.ultimo_mandato?.endereco"
                class="t13"
              >
                {{ emFoco.ultimo_mandato.endereco }}
              </dd>
            </dl>

            <dl>
              <dt>
                Gabinete
              </dt>
              <dd
                v-if="emFoco.ultimo_mandato?.gabinete"
              >
                {{ emFoco.ultimo_mandato.gabinete }}
              </dd>
            </dl>

            <dl v-if="emFoco.ultimo_mandato?.email">
              <dt>
                Email
              </dt>
              <dd>
                {{ emFoco.ultimo_mandato.email }}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <ParlamentaresExibirRepresentatividade />
    </div>
  </div>
</template>

<script setup>
import ParlamentaresExibirRepresentatividade from '@/components/parlamentares/ParlamentaresExibirRepresentatividade.vue';
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

  if (emFoco.value.equipe) {
    emFoco.value.equipe.sort((a, b) => a.nome.localeCompare(b.nome));
  }
});

function formatarNumero(numero) {
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

</script>

<style scoped lang="less">

.carometro {

}

.carometro__cabeçalho{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  max-width: 1000px;

  div{
    min-width: 300px;
  }
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
  font-size: 20px;
}

dd {
  font-weight: 400;
  color: #233B5C;
  font-size: 16px;
  margin-bottom: 15px;
}

.eleicao {
  display: grid;
  max-width:650px;
  grid-template-columns: repeat(2, 1fr);
  justify-items: center;
  gap: 15px;
  margin: 0 auto;
}

.eleicao > div {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 20px;
  border-top: solid 2px #B8C0CC;
  border-radius: 12px;
  max-width: 300px;
}

.eleicao > div dt {
  font-size: 20px;
}

.biografia{
  max-height: 370px;
  overflow-y: auto;
  font-size: 16px;
  line-height: 24px;
}

.tablemain td {
    padding: 0.75em 1em;
    text-overflow: ellipsis;
    font-size: 16px;
}

table{
  max-width: 1000px;
  margin: 0 auto;
}
</style>
