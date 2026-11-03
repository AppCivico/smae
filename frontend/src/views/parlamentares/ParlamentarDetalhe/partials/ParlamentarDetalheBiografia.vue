<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import ParlamentaresExibirRepresentatividade
  from '@/components/parlamentares/ParlamentaresExibirRepresentatividade.vue';
import ParlamentarExibirSuplentes from '@/components/parlamentares/ParlamentarExibirSuplentes.vue';
import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import type { Colunas } from '@/components/SmaeTable/tipagem';
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

const equipe = computed<Pessoa[]>(() => (emFoco.value?.equipe || [])
  .toSorted((a: Pessoa, b: Pessoa) => a.nome.localeCompare(b.nome)));

const assessores = computed(() => equipe.value.filter((pessoa) => pessoa.tipo === 'Assessor'));
const contatos = computed(() => equipe.value.filter((pessoa) => pessoa.tipo === 'Contato'));

const colunasDaEquipe: Colunas = [
  {
    chave: 'nome',
    label: 'Nome',
    atributosDaColuna: { class: 'col--nome' },
  },
  {
    chave: 'telefone',
    label: 'Telefone',
    formatador: (telefone) => (telefone as string) || '—',
    atributosDaColuna: { class: 'col--telefone' },
  },
  {
    chave: 'email',
    label: 'Email',
    formatador: (email) => (email as string) || '—',
  },
];

const podeVerTelefone = computed(() => authStore.temPermissãoPara('SMAE.acesso_telefone'));

const cargo = computed(() => {
  const valor = mandato.value?.cargo as keyof typeof cargosDeParlamentar | undefined;

  // PR #835 — robsonsobral:
  // "Eu gosto disso, mas muita gente ficar confusa. Não valeria a pena ter parênteses ao menos?"
  // Código anterior:
  // return valor ? cargosDeParlamentar[valor]?.nome || valor : '—';
  // Correção:
  return valor ? (cargosDeParlamentar[valor]?.nome || valor) : '—';
});

const votos = (valor: number | null | undefined) => (valor
  ? dinheiro(valor, { semDecimais: true })
  : '—');

const percentualDosVotos = (parte: number | null | undefined) => {
  const total = Number(mandato.value?.votos_estado);

  return total && parte ? Math.round((Number(parte) / total) * 100) : 0;
};

const simOuNao = (valor: unknown) => (valor ? 'Sim' : 'Não');

const parteDosVotos = (chave: string, titulo: string, valor: number | null | undefined) => ({
  chave,
  titulo,
  valor: votos(valor),
  atributosDoItem: { class: 'biografia-do-parlamentar__votos' },
  metadados: { percentual: percentualDosVotos(valor) },
});

const listaDeRepresentatividade = computed(() => [
  {
    chave: 'votos_estado',
    titulo: 'Votos no Estado',
    valor: votos(mandato.value?.votos_estado),
  },
  parteDosVotos('votos_capital', 'Votos na Capital', mandato.value?.votos_capital),
  parteDosVotos('votos_interior', 'Votos no Interior', mandato.value?.votos_interior),
]);

const listaDeContato = computed(() => [
  { chave: 'endereco', titulo: 'Endereço', valor: mandato.value?.endereco },
  { chave: 'gabinete', titulo: 'Gabinete', valor: mandato.value?.gabinete },
  { chave: 'email', titulo: 'Email', valor: mandato.value?.email || emFoco.value?.email },
  ...(podeVerTelefone.value
    ? [{
      chave: 'telefone',
      titulo: 'Telefone',
      valor: mandato.value?.telefone || emFoco.value?.telefone,
    }]
    : []),
]);
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
        </header>

        <SmaeTable
          class="biografia-do-parlamentar__tabela"
          :colunas="colunasDaEquipe"
          :dados="grupo.pessoas"
        >
          <template
            v-if="!grupo.pessoas.length"
            #corpo
          >
            <tr>
              <td colspan="3">
                Nenhum registro encontrado.
              </td>
            </tr>
          </template>
        </SmaeTable>
      </section>
    </template>

    <section
      v-if="mandato"
      class="biografia-do-parlamentar__secao"
    >
      <header class="biografia-do-parlamentar__cabecalho">
        <h3>Eleição {{ mandato.eleicao?.ano }}</h3>
      </header>

      <div class="biografia-do-parlamentar__cartoes">
        <section class="biografia-do-parlamentar__cartao">
          <header class="biografia-do-parlamentar__cartao-cabecalho">
            <h4>Resumo da eleição</h4>
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
          </header>

          <SmaeDescriptionList
            class="biografia-do-parlamentar__dados biografia-do-parlamentar__dados--coluna"
            layout="grid"
            :lista="listaDeRepresentatividade"
          >
            <template #descricao="{ item }">
              <template v-if="item.metadados">
                <span class="biografia-do-parlamentar__valor-dos-votos">{{ item.valor }}</span>
                {{ ' ' }}
                <span
                  class="biografia-do-parlamentar__barra-de-votos"
                  :style="{ '--percentual': `${item.metadados.percentual}%` }"
                >{{ item.metadados.percentual }}%</span>
              </template>
              <template v-else>
                {{ item.valor }}
              </template>
            </template>
          </SmaeDescriptionList>
        </section>

        <section class="biografia-do-parlamentar__cartao">
          <header class="biografia-do-parlamentar__cartao-cabecalho">
            <h4>Informações de Contato</h4>
          </header>

          <SmaeDescriptionList
            class="biografia-do-parlamentar__dados"
            layout="grid"
            :lista="listaDeContato"
          />
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
  max-width: 85.6rem;
  color: #233b5c;
}

.biografia-do-parlamentar__secao {
  margin-bottom: 4rem;
}

.biografia-do-parlamentar__cabecalho,
.biografia-do-parlamentar__reaproveitado :deep(.flex.spacebetween.center) {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  margin-bottom: 2.3rem;

  h3 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.3;
    white-space: nowrap;
    color: @amarelo;
  }
}

.biografia-do-parlamentar__cabecalho::after,
.biografia-do-parlamentar__reaproveitado :deep(.flex.spacebetween.center hr) {
  flex-grow: 1;
  margin: 0;
  border: 0;
  border-top: 0.1rem solid #889bb7;
}

.biografia-do-parlamentar__cabecalho::after {
  content: '';
}

.biografia-do-parlamentar__cabecalho--largo {
  gap: 1.7rem;
  margin-bottom: 1.7rem;

  &::after {
    border-top: 0.1rem solid @c500;
  }
}

.biografia-do-parlamentar__texto {
  font-size: 1.1rem;
  line-height: 1.3;

  :deep(p) {
    margin: 0 0 1.1rem;
  }
}

.biografia-do-parlamentar__tabela :deep(table),
.biografia-do-parlamentar__reaproveitado :deep(table) {
  width: 100%;
  max-width: none;
  margin: 0;
  border-collapse: collapse;

  tr {
    background-color: transparent;
  }

  th {
    padding: 0.8rem 0.6rem;
    border-bottom: 0.1rem solid @c100;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.2;
    text-align: left;
    text-transform: uppercase;
    color: @c300;
  }

  td {
    height: 5.7rem;
    padding: 1rem 1.3rem;
    border-bottom: 0.1rem solid @c100;
    font-size: 1.2rem;
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

.biografia-do-parlamentar__tabela :deep(table) {
  tr {
    border-bottom: 0;
  }

  th,
  td {
    overflow: visible;
  }
}

.biografia-do-parlamentar__cartoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 36.1rem));
  justify-content: center;
  gap: 3.8rem 4.1rem;
}

.biografia-do-parlamentar__cartao {
  min-height: 20.1rem;
  padding: 1.5rem 2.6rem 2.3rem 3.2rem;
  border-radius: 0.9rem;
  background-color: @branco;
  box-shadow: 0 0.7rem 1.4rem 0 fade(@primary, 10%);
}

.biografia-do-parlamentar__cartao-cabecalho {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  margin-bottom: 1.1rem;

  h4 {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 700;
    line-height: 1.3;
    white-space: nowrap;
    color: @c400;
  }

  &::after {
    content: '';
    flex-grow: 1;
    margin: 0;
    border: 0;
    border-top: 0.1rem solid @c400;
  }
}

// `SmaeDescriptionList` tem raiz múltipla e não recebe o escopo deste componente, daí o `:deep()`.
.biografia-do-parlamentar__cartao :deep(.biografia-do-parlamentar__dados) {
  display: grid;
  grid-template-columns: 18.9rem 1fr;
  gap: 0.7rem 0;
  margin: 0;

  dt {
    // `.mb05`, aplicada pelo `SmaeDescriptionList`, usa !important
    margin-bottom: 0 !important;
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.3;
    text-transform: none;
    color: @amarelo;
  }

  dd {
    margin: 0.3rem 0 0;
    font-size: 1.1rem;
    line-height: 1.3;
    white-space: pre-line;
  }
}

.biografia-do-parlamentar__cartao :deep(.biografia-do-parlamentar__dados--coluna) {
  grid-template-columns: 1fr;
}

.biografia-do-parlamentar__cartao :deep(.biografia-do-parlamentar__votos) {
  display: grid;
  grid-template-columns: 13.2rem 17.1rem;
  grid-template-areas:
    'rotulo barra'
    'valor barra';
  align-items: start;

  dt {
    grid-area: rotulo;
  }

  dd {
    display: contents;
  }
}

.biografia-do-parlamentar__valor-dos-votos {
  grid-area: valor;
  margin-top: 0.3rem;
}

.biografia-do-parlamentar__barra-de-votos {
  grid-area: barra;
  position: relative;
  align-self: end;
  padding-top: 1.6rem;
  font-size: 1rem;
  color: @amarelo;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 1.2rem;
    border-radius: 0.6rem;
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
