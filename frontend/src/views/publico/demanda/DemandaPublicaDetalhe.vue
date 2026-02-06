<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import ErrorComponent from '@/components/ErrorComponent.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import dinheiro from '@/helpers/dinheiro';
import requestS from '@/helpers/requestS';

const route = useRoute();

const demanda = ref(null);
const chamadasPendentes = ref({ emFoco: false });
const erro = ref(null);

const dadosDemanda = computed(() => {
  if (!demanda.value) return [];

  const dados = [
    {
      chave: 'gestor_municipal',
      titulo: 'Gestor Municipal',
      valor: demanda.value.gestor_municipal?.nome_exibicao,
      larguraBase: '20em',
    },
    {
      chave: 'nome_projeto',
      titulo: 'Nome do Projeto',
      valor: demanda.value.nome_projeto,
      larguraBase: '20em',
    },
    {
      chave: 'descricao',
      titulo: 'Descrição',
      valor: demanda.value.descricao,
      larguraBase: '100%',
    },
    {
      chave: 'justificativa',
      titulo: 'Justificativa',
      valor: demanda.value.justificativa,
      larguraBase: '100%',
    },
    {
      chave: 'area_tematica',
      titulo: 'Área Temática',
      valor: demanda.value.area_tematica?.nome,
      larguraBase: '20em',
    },
  ];

  if (demanda.value.acoes?.length) {
    dados.push({
      chave: 'acoes',
      titulo: 'Ações',
      valor: demanda.value.acoes.map((a) => a.nome).join(', '),
      larguraBase: '20em',
      metadados: { acoes: demanda.value.acoes },
    });
  }

  dados.push(
    {
      chave: 'valor',
      titulo: 'Valor',
      valor: dinheiro(demanda.value.valor, {
        style: 'currency',
        currency: 'BRL',
      }),
    },
    {
      chave: 'finalidade',
      titulo: 'Finalidade',
      valor: demanda.value.finalidade,
    },
  );

  if (demanda.value.observacao) {
    dados.push({
      chave: 'observacao',
      titulo: 'Observação',
      valor: demanda.value.observacao,
      larguraBase: '100%',
    });
  }

  return dados;
});

function urlImagem(arquivo) {
  return `${arquivo.caminho_completo}?download_token=${arquivo.download_token}`;
}

async function buscarDemanda() {
  chamadasPendentes.value.emFoco = true;
  erro.value = null;

  try {
    const resposta = await requestS.get(
      `${import.meta.env.VITE_API_URL}/public/demandas/${route.params.id}`,
      null,
      { AlertarErros: false },
    );

    demanda.value = resposta.demanda;
  } catch (e) {
    erro.value = 'Não foi possível carregar as informações da demanda.';
    console.error('Erro ao buscar demanda pública:', e);
  } finally {
    chamadasPendentes.value.emFoco = false;
  }
}

onMounted(() => {
  buscarDemanda();
});
</script>

<template>
  <LoadingComponent v-if="chamadasPendentes.emFoco" />
  <ErrorComponent
    v-else-if="erro"
  >
    {{ erro }}
  </ErrorComponent>
  <div
    v-else-if="demanda"
    class="demanda-publica"
  >
    <CabecalhoDePagina class="mb2" />

    <SmaeDescriptionList :lista="dadosDemanda">
      <template #descricao--acoes="{ item }">
        <ul class="demanda-publica__lista-acoes">
          <li
            v-for="acao in item.metadados.acoes"
            :key="acao.id"
          >
            {{ acao.nome }}
          </li>
        </ul>
      </template>
    </SmaeDescriptionList>

    <div class="flex column g2">
      <section
        v-if="demanda.arquivos?.length"
        class="demanda-publica__secao"
      >
        <div class="demanda-publica__galeria">
          <div
            v-for="arquivo in demanda.arquivos"
            :key="arquivo.id"
            class="demanda-publica__imagem-container"
          >
            <img
              :src="urlImagem(arquivo)"
              :alt="arquivo.descricao || 'Imagem da demanda'"
              class="demanda-publica__imagem"
            >
          </div>
        </div>
      </section>

      <section
        v-if="demanda.geolocalizacao?.length"
        class="demanda-publica__secao"
      >
        <div class="demanda-publica__mapa-placeholder">
          <p class="demanda-publica__mapa-texto">
            Mapinha do Sobral
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '@/_less/variables.less';

.demanda-publica__subtitulo {
  font-size: 1.5rem;
  font-weight: 600;
  color: @primary;
  margin: 0 0 1rem 0;
}

.demanda-publica__lista-acoes {
  list-style-position: inside;
  padding: 0;
  margin: 0;

  li {
    font-size: 1rem;
    color: @escuro;
    line-height: 1.5;
    margin-bottom: 0.5rem;
  }
}

.demanda-publica__galeria {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.demanda-publica__imagem-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.demanda-publica__imagem {
  width: 100%;
  height: 19rem;
  object-fit: cover;
  .br(16px);
  .bs(0 2px 8px rgba(0, 0, 0, 0.1));
}

.demanda-publica__imagem-legenda {
  font-size: 0.875rem;
  color: @c500;
  margin: 0;
  text-align: center;
}

.demanda-publica__mapa-placeholder {
  width: 100%;
  height: 400px;
  background-color: @c50;
  border: 2px dashed @c200;
  .br(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.demanda-publica__mapa-texto {
  font-size: 1rem;
  color: @c400;
  font-style: italic;
}
</style>
