<template>
  <FormularioQueryString
    :aria-busy="props.ariaBusy || !pronto"
    :valores-padrao="{
      ordem_coluna: 'id',
      ordem_direcao: 'asc',
      ipp: gblIpp,
      pagina: 1,
    }"
  >
    <div class="flex flexwrap end g2 fb100">
      <div class="f1 fb20em">
        <label
          class="label"
          for="assuntos"
        >
          {{ schema.fields.assuntos?.spec.label || 'Campo faltando no schema' }}
        </label>
        <select
          id="assuntos"
          name="assuntos"
          class="inputtext light"
          :aria-busy="chamadasPendentesDeAssuntos.lista"
          :class="{ error: erroDeAssuntos }"
        >
          <option value="" />
          <option
            v-for="assuntos in listaDeAssuntos"
            :key="assuntos.id"
            :value="assuntos.id"
            :selected="Number($route.query.assuntos) === assuntos.id"
          >
            {{ assuntos.nome }}
          </option>
        </select>
      </div>

      <div class="f1 fb20em">
        <label
          class="label"
          for="descricao"
        >{{ schema.fields.descricao?.spec.label || 'Campo faltando no schema' }}</label>
        <input
          id="descricao"
          class="inputtext light"
          name="palavra_chave"
          type="text"
          :value="$route.query.descricao"
        >
      </div>

      <div class="f1 fb20em">
        <label
          class="label"
          for="titulo"
        >{{ schema.fields.titulo.spec.label }}</label>
        <input
          id="titulo"
          class="inputtext light"
          name="palavra_chave"
          type="text"
          :value="$route.query.titulo"
        >
      </div>

      <div class="f1 fb20em">
        <label
          class="label"
          for="codigo"
        >{{ schema.fields.codigo?.spec.label || 'Campo faltando no schema' }}</label>
        <input
          id="codigo"
          class="inputtext light"
          name="palavra_chave"
          type="text"
          :value="$route.query.codigo"
        >
      </div>
    </div>

    <div class="flex flexwrap end g2 fb100">
      <div class="f1 fb10em">
        <label
          class="label"
          for="plano-setorial-id"
        >
          {{ schema.fields.plano_setorial_id?.spec.label || 'Campo faltando no schema' }}
        </label>
        <select
          id="plano-setorial-id"
          name="plano_setorial_id"
          class="inputtext light"
          :aria-busy="chamadasPendentesDePlanosSetoriais.lista"
          :class="{
            error: errosDePlanosSetoriais.lista
          }"
        >
          <option value="" />
          <option
            v-for="plano in listaDePlanosSetoriais"
            :key="plano.id"
            :value="plano.id"
            :selected="Number($route.query.plano_setorial_id) === plano.id"
          >
            {{ plano.nome }}
          </option>
        </select>
      </div>

      <div class="f1 fb10em">
        <label
          class="label"
          for="meta-id"
        >
          Meta
        </label>
        <select
          id="meta-id"
          name="metas"
          class="inputtext light"
          :aria-busy="chamadasPendentesDeMetas.lista"
          :class="{ error: errosDeMetas.lista }"
        >
          <option value="" />
          <option
            v-for="meta in listaDeMetas"
            :key="meta.id"
            :value="meta.id"
            :selected="Number($route.query.meta_id) === meta.id"
            :title="meta.titulo?.length > 36 ? meta.titulo : undefined"
          >
            {{ truncate(meta.titulo, 36) }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label"
          for="regiao-ids"
        >
          {{ schema.fields.regiao_ids?.spec.label || 'Campo faltando no schema' }}
        </label>
        <select
          id="regiao-ids"
          name="regioes"
          class="inputtext light"
          :aria-busy="regions.loading"
        >
          <option value="" />
          <option
            v-for="regiao in regiõesPorNível[3]"
            :key="regiao.id"
            :value="regiao.id"
          >
            {{ regiao.descricao }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label"
          for="periodicidade"
        >
          {{ schema.fields.periodicidade.spec.label }}
        </label>
        <select
          id="periodicidade"
          name="periodicidade"
          class="inputtext light"
        >
          <option value="" />

          <option
            v-for="item in periodicidades.variaveis"
            :key="item.valor"
            :value="item.valor"
            :disabled="!Object.keys(periodicidades.variaveis).length"
            :selected="$route.query.periodicidade === item.valor"
          >
            {{ item.nome }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex flexwrap end g2 fb100">
      <div class="f1 fb10em">
        <label
          class="label"
          for="orgao-id"
        >
          {{ schema.fields.orgao_id?.spec.label || 'Campo faltando no schema' }}
        </label>
        <select
          id="orgao-id"
          name="orgao_id"
          class="inputtext light"
          :aria-busy="organs.loading"
          :class="{ error: organs.error }"
        >
          <option value="" />
          <option
            v-for="orgao in órgãosComoLista"
            :key="orgao.id"
            :value="orgao.id"
            :selected="Number($route.query.orgao_id) === orgao.id"
          >
            {{ orgao.sigla }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label"
          for="orgao-proprietario-id"
        >
          {{ schema.fields.orgao_proprietario_id?.spec.label || 'Campo faltando no schema' }}
        </label>
        <select
          id="orgao-proprietario-id"
          name="orgao_proprietario_id"
          class="inputtext light"
          :aria-busy="organs.loading"
          :class="{ error: organs.error }"
        >
          <option value="" />
          <option
            v-for="orgao in órgãosComoLista"
            :key="orgao.id"
            :value="orgao.id"
            :selected="Number($route.query.orgao_proprietario_id) === orgao.id"
          >
            {{ orgao.sigla }}
          </option>
        </select>
      </div>
    </div>

    <div class="f1 fb25em">
      <label
        class="label"
        for="palavra-chave"
      >Palavra-chave</label>
      <input
        id="palavra-chave"
        class="inputtext light"
        name="palavra_chave"
        type="search"
        :value="$route.query.palavra_chave"
      >
    </div>
    <div class="f1 fb10em">
      <label
        class="label"
        for="ordem-coluna"
      >Ordenar por</label>
      <select
        id="ordem-coluna"
        class="inputtext light"
        name="ordem_coluna"
      >
        <option
          v-for="coluna in colunasParaOrdenacao"
          :key="coluna.valor"
          :value="coluna.valor"
          :selected="Number($route.query.ordem_coluna) === coluna.valor"
        >
          {{ coluna.nome }}
        </option>
      </select>
    </div>
    <div class="f1 fb10em">
      <label
        class="label"
        for="ordem-direcao"
      >Direção</label>
      <select
        id="ordem-direcao"
        class="inputtext light"
        name="ordem_direcao"
      >
        <option
          v-for="direcao in
            Object.values(direcoesDeOrdenacao)"
          :key="direcao.valor"
          :value="direcao.valor"
          :selected="$route.query.ordem_direcao === direcao.valor"
        >
          {{ direcao.nome || direcao.valor }}
        </option>
      </select>
    </div>
    <div class="f1 fb10em">
      <label
        class="label"
        for="itens-por-pagina"
      >Itens por página</label>
      <select
        id="itens-por-pagina"
        class="inputtext light"
        name="ipp"
      >
        <option
          v-for="quantidade in itensPorPagina"
          :key="quantidade"
          :value="quantidade"
          :selected="Number($route.query.ipp) === quantidade"
        >
          {{ quantidade }}
        </option>
      </select>
    </div>
  </FormularioQueryString>
</template>
<script setup>
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import direcoesDeOrdenacao from '@/consts/direcoesDeOrdenacao';
import { variável } from '@/consts/formSchemas';
import periodicidades from '@/consts/periodicidades';
import truncate from '@/helpers/truncate';
import { useAssuntosStore } from '@/stores/assuntosPs.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { usePsMetasStore } from '@/stores/ps.metas.store.ts';
import { useRegionsStore } from '@/stores/regions.store';
import { storeToRefs } from 'pinia';
import { onUnmounted, ref } from 'vue';

const props = defineProps({
  ariaBusy: {
    type: Boolean,
    default: false,
  },
});

const schema = variável();

const colunasParaOrdenacao = {
  id: {
    valor: 'id',
    nome: '',
  },
  titulo: {
    valor: 'titulo',
    nome: schema.fields.titulo?.spec.label,
  },
  codigo: {
    valor: 'codigo',
    nome: 'Código',
  },
  assunto_variavel: {
    valor: 'assunto_variavel',
    nome: schema.fields.assunto_id?.spec.label || 'campo faltando no schema',
  },
  orgao_nome: {
    valor: 'orgao_nome',
    nome: schema.fields.orgao_id.spec.label,
  },
  orgao_proprietario_nome: {
    valor: 'orgao_proprietario_nome',
    nome: schema.fields.orgao_proprietario_id?.spec.label || 'campo faltando no schema',
  },
  periodicidade: {
    valor: 'periodicidade',
    nome: schema.fields.periodicidade?.spec.label,
  },
  regiao: {
    valor: 'regiao',
    nome: schema.fields.regiao_id?.spec.label,
  },
  criado_em: {
    valor: 'criado_em',
    nome: 'Data de registro',
  },
};

const itensPorPagina = [
  10,
  25,
  50,
  100,
];

const assuntosStore = useAssuntosStore();
const MetasStore = usePsMetasStore();
const ÓrgãosStore = useOrgansStore();
const planosSetoriaisStore = usePlanosSetoriaisStore();
const regionsStore = useRegionsStore();

const {
  lista: listaDePlanosSetoriais,
  chamadasPendentes: chamadasPendentesDePlanosSetoriais,
  erros: errosDePlanosSetoriais,
} = storeToRefs(planosSetoriaisStore);

const {
  lista: listaDeMetas,
  chamadasPendentes: chamadasPendentesDeMetas,
  erros: errosDeMetas,
} = storeToRefs(MetasStore);

const {
  órgãosComoLista,
  organs,
} = storeToRefs(ÓrgãosStore);

const {
  lista: listaDeAssuntos,
  chamadasPendentes: chamadasPendentesDeAssuntos,
  erro: erroDeAssuntos,
} = storeToRefs(assuntosStore);

const {
  regions, regiõesPorNível,
} = storeToRefs(regionsStore);

const pronto = ref(false);

function iniciar() {
  const promessas = [
    assuntosStore.buscarTudo(),
    MetasStore.buscarTudo(),
    ÓrgãosStore.getAll(),
    planosSetoriaisStore.buscarTudo(),
    regionsStore.getAll(),
  ];

  Promise.allSettled(promessas)
    .then(() => {
      pronto.value = true;
    });
}

iniciar();

onUnmounted(() => {
  assuntosStore.$reset();
  MetasStore.$reset();
  ÓrgãosStore.$reset();
  planosSetoriaisStore.$reset();
  regionsStore.$reset();
});
</script>
