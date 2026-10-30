<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import ParlamentaresExibirRepresentatividade
  from '@/components/parlamentares/ParlamentaresExibirRepresentatividade.vue';
import ParlamentarExibirSuplentes from '@/components/parlamentares/ParlamentarExibirSuplentes.vue';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import dinheiro from '@/helpers/dinheiro';
import { useAuthStore } from '@/stores/auth.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';

withDefaults(defineProps<{
  exibirEdicao?: boolean;
}>(), {
  exibirEdicao: false,
});

const authStore = useAuthStore();
const { emFoco } = storeToRefs(useParlamentaresStore());

const mandato = computed(() => emFoco.value?.ultimo_mandato);

type Pessoa = {
  id: number;
  nome: string;
  tipo: string;
  telefone: string | null;
  email: string | null;
};

const equipe = computed<Pessoa[]>(() => [...(emFoco.value?.equipe || [])]
  .sort((a: Pessoa, b: Pessoa) => a.nome.localeCompare(b.nome)));

const assessores = computed(() => equipe.value.filter((pessoa) => pessoa.tipo === 'Assessor'));
const contatos = computed(() => equipe.value.filter((pessoa) => pessoa.tipo === 'Contato'));

const podeVerTelefone = computed(() => authStore.temPermissãoPara('SMAE.acesso_telefone'));

const cargo = computed(() => {
  const valor = mandato.value?.cargo as keyof typeof cargosDeParlamentar | undefined;

  return valor ? cargosDeParlamentar[valor]?.nome || valor : '—';
});

const votos = (valor: number | null | undefined) => (valor
  ? dinheiro(valor, { semDecimais: true })
  : '—');

const percentualDosVotos = (parte: number | null | undefined) => {
  const total = Number(mandato.value?.votos_estado);

  return total && parte ? Math.round((Number(parte) / total) * 100) : 0;
};

const simOuNao = (valor: unknown) => (valor ? 'Sim' : 'Não');
</script>

<template>
  <div class="biografia-do-parlamentar">
    <section
      v-if="mandato?.atuacao"
      class="biografia-do-parlamentar__secao"
    >
      <header
        class="biografia-do-parlamentar__cabecalho biografia-do-parlamentar__cabecalho--largo"
      >
        <h3>Área de Atuação</h3>
        <hr>
      </header>

      <div
        class="biografia-do-parlamentar__texto"
        v-html="mandato.atuacao"
      />
    </section>

    <section
      v-if="mandato?.biografia"
      class="biografia-do-parlamentar__secao"
    >
      <header
        class="biografia-do-parlamentar__cabecalho biografia-do-parlamentar__cabecalho--largo"
      >
        <h3>Biografia</h3>
        <hr>
      </header>

      <div
        class="biografia-do-parlamentar__texto"
        v-html="mandato.biografia"
      />
    </section>

    <template
      v-for="grupo in [
        { titulo: 'Assessores', pessoas: assessores },
        { titulo: 'Contatos', pessoas: contatos },
      ]"
      :key="grupo.titulo"
    >
      <section class="biografia-do-parlamentar__secao">
        <header class="biografia-do-parlamentar__cabecalho">
          <h3>{{ grupo.titulo }}</h3>
          <hr>
        </header>

        <table class="biografia-do-parlamentar__tabela">
          <colgroup>
            <col class="col--nome">
            <col class="col--telefone">
            <col>
          </colgroup>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="pessoa in grupo.pessoas"
              :key="pessoa.id"
            >
              <td>{{ pessoa.nome }}</td>
              <td class="biografia-do-parlamentar__telefone">
                {{ pessoa.telefone || '—' }}
              </td>
              <td>{{ pessoa.email || '—' }}</td>
            </tr>
            <tr v-if="!grupo.pessoas.length">
              <td colspan="3">
                Nenhum registro encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <section
      v-if="mandato"
      class="biografia-do-parlamentar__secao"
    >
      <header class="biografia-do-parlamentar__cabecalho">
        <h3>Eleição {{ mandato.eleicao?.ano }}</h3>
        <hr>
      </header>

      <div class="biografia-do-parlamentar__cartoes">
        <section class="biografia-do-parlamentar__cartao">
          <header class="biografia-do-parlamentar__cartao-cabecalho">
            <h4>Resumo da eleição</h4>
            <hr>
          </header>

          <dl class="biografia-do-parlamentar__dados">
            <div>
              <dt>Eleito</dt>
              <dd>{{ simOuNao(mandato.eleito) }}</dd>
            </div>
            <div>
              <dt>UF</dt>
              <dd>{{ mandato.uf || '—' }}</dd>
            </div>
            <div>
              <dt>Suplente</dt>
              <dd>{{ simOuNao(mandato.suplencia) }}</dd>
            </div>
            <div>
              <dt>Cargo</dt>
              <dd>{{ cargo }}</dd>
            </div>
            <div>
              <dt>Em atividade?</dt>
              <dd>{{ simOuNao(emFoco?.em_atividade) }}</dd>
            </div>
          </dl>
        </section>

        <section class="biografia-do-parlamentar__cartao">
          <header class="biografia-do-parlamentar__cartao-cabecalho">
            <h4>Partido</h4>
            <hr>
          </header>

          <dl class="biografia-do-parlamentar__dados biografia-do-parlamentar__dados--coluna">
            <div>
              <dt>Partido Atual</dt>
              <dd>{{ mandato.partido_atual?.sigla || '—' }}</dd>
            </div>
            <div>
              <dt>Partido da Candidatura</dt>
              <dd>{{ mandato.partido_candidatura?.sigla || '—' }}</dd>
            </div>
          </dl>
        </section>

        <section class="biografia-do-parlamentar__cartao">
          <header class="biografia-do-parlamentar__cartao-cabecalho">
            <h4>Representatividade</h4>
            <hr>
          </header>

          <dl class="biografia-do-parlamentar__dados biografia-do-parlamentar__dados--coluna">
            <div>
              <dt>Votos no Estado</dt>
              <dd>{{ votos(mandato.votos_estado) }}</dd>
            </div>
            <div
              v-for="parte in [
                { rotulo: 'Votos na Capital', valor: mandato.votos_capital },
                { rotulo: 'Votos no Interior', valor: mandato.votos_interior },
              ]"
              :key="parte.rotulo"
              class="biografia-do-parlamentar__votos"
            >
              <dt>{{ parte.rotulo }}</dt>
              <dd>{{ votos(parte.valor) }}</dd>
              <dd
                class="biografia-do-parlamentar__barra-de-votos"
                :style="{ '--percentual': `${percentualDosVotos(parte.valor)}%` }"
              >
                {{ percentualDosVotos(parte.valor) }}%
              </dd>
            </div>
          </dl>
        </section>

        <section class="biografia-do-parlamentar__cartao">
          <header class="biografia-do-parlamentar__cartao-cabecalho">
            <h4>Informações de Contato</h4>
            <hr>
          </header>

          <dl class="biografia-do-parlamentar__dados">
            <div>
              <dt>Endereço</dt>
              <dd>{{ mandato.endereco || '—' }}</dd>
            </div>
            <div>
              <dt>Gabinete</dt>
              <dd>{{ mandato.gabinete || '—' }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ mandato.email || emFoco?.email || '—' }}</dd>
            </div>
            <div v-if="podeVerTelefone">
              <dt>Telefone</dt>
              <dd>{{ mandato.telefone || emFoco?.telefone || '—' }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>

    <div class="biografia-do-parlamentar__reaproveitado">
      <ParlamentaresExibirRepresentatividade :exibir-edição="exibirEdicao" />
    </div>

    <div class="biografia-do-parlamentar__reaproveitado">
      <ParlamentarExibirSuplentes :exibir-edição="exibirEdicao" />
    </div>
  </div>
</template>

<style scoped lang="less">
.biografia-do-parlamentar {
  max-width: 1199px;
  color: #233b5c;
}

.biografia-do-parlamentar__secao {
  margin-bottom: 56px;
}

.biografia-do-parlamentar__cabecalho,
.biografia-do-parlamentar__reaproveitado :deep(.flex.spacebetween.center) {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.3;
    white-space: nowrap;
    color: @amarelo;
  }

  hr {
    flex-grow: 1;
    margin: 0;
    border: 0;
    border-top: 1.5px solid #889bb7;
  }
}

.biografia-do-parlamentar__cabecalho--largo {
  gap: 24px;
  margin-bottom: 24px;

  hr {
    border-top: 1px solid @c500;
  }
}

.biografia-do-parlamentar__texto {
  font-size: 16px;
  line-height: 1.3;

  :deep(p) {
    margin: 0 0 16px;
  }
}

.biografia-do-parlamentar__tabela,
.biografia-do-parlamentar__reaproveitado :deep(table) {
  width: 100%;
  max-width: none;
  margin: 0;
  border-collapse: collapse;

  tr {
    background-color: transparent;
  }

  th {
    padding: 10.6px 8px;
    border-bottom: 1.18px solid @c100;
    font-size: 14.12px;
    font-weight: 700;
    line-height: 1.2;
    text-align: left;
    text-transform: uppercase;
    color: @c300;
  }

  td {
    height: 80px;
    padding: 14.12px 18.83px;
    border-bottom: 1.18px solid @c100;
    font-size: 16.48px;
    line-height: 1.3;
    color: @primary;
  }

  .col--nome {
    width: 34%;
  }

  .col--telefone {
    width: 26%;
  }
}

.biografia-do-parlamentar__telefone {
  font-size: 20px;
  color: #233b5c;
}

.biografia-do-parlamentar__cartoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 506px));
  justify-content: center;
  gap: 53px 57px;
}

.biografia-do-parlamentar__cartao {
  min-height: 282px;
  padding: 21px 37px 32px 45px;
  border-radius: 12px;
  background-color: @branco;
  box-shadow: 0 9.66px 19.32px 0 fade(@primary, 10%);
}

.biografia-do-parlamentar__cartao-cabecalho {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 15px;

  h4 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.3;
    white-space: nowrap;
    color: @c400;
  }

  hr {
    flex-grow: 1;
    margin: 0;
    border: 0;
    border-top: 1px solid @c400;
  }
}

.biografia-do-parlamentar__dados {
  display: grid;
  grid-template-columns: 264px 1fr;
  gap: 10px 0;
  margin: 0;

  dt {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.3;
    color: @amarelo;
  }

  dd {
    margin: 4px 0 0;
    font-size: 16px;
    line-height: 1.3;
    white-space: pre-line;
  }
}

.biografia-do-parlamentar__dados--coluna {
  grid-template-columns: 1fr;
}

.biografia-do-parlamentar__votos {
  display: grid;
  grid-template-columns: 185px 239px;
  grid-template-areas:
    'rotulo barra'
    'valor barra';
  align-items: start;

  dt {
    grid-area: rotulo;
  }

  dd {
    grid-area: valor;
  }
}

.biografia-do-parlamentar__barra-de-votos.biografia-do-parlamentar__barra-de-votos {
  grid-area: barra;
  position: relative;
  align-self: end;
  margin: 0;
  padding-top: 23px;
  font-size: 14px;
  color: @amarelo;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 17px;
    border-radius: 8.5px;
  }

  &::before {
    right: 0;
    background-color: @c200;
  }

  &::after {
    width: var(--percentual);
    background-color: @amarelo;
  }
}
</style>
