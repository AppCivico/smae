<template>
  <form
    class="flex flexwrap g2 mb2 fb100"
    :aria-busy="!!$attrs.ariaBusy || !pronto"
    @submit.prevent="($e) => emit('enviado', $e)"
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
          <option
            value=""
            :selected="!valoresIniciaisConsolidados.assuntos"
          />
          <option
            v-for="assunto in listaDeAssuntos"
            :key="assunto.id"
            :value="assunto.id"
            :selected="Number(valoresIniciaisConsolidados?.assuntos) === assunto.id"
          >
            {{ assunto.nome }}
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
          :value="valoresIniciaisConsolidados.descricao"
          class="inputtext light"
          name="descricao"
          type="text"
        >
      </div>

      <div class="f1 fb20em">
        <label
          class="label"
          for="titulo"
        >{{ schema.fields.titulo.spec.label }}</label>
        <input
          id="titulo"
          :value="valoresIniciaisConsolidados.titulo"
          class="inputtext light"
          name="titulo"
          type="text"
        >
      </div>

      <div class="f1 fb20em">
        <label
          class="label"
          for="variavel_categorica_idd"
        >
          Tipo de variavel
        </label>
        <select
          id="variavel_categorica_id"
          name="variavel_categorica_id"
          class="inputtext light"
          :aria-busy="chamadasPendentesDeVariaveisCategoricas.lista"
        >
          <option
            value=""
            :selected="!valoresIniciaisConsolidados.variavel_categorica_id"
          />
          <option
            :value="-2147483648"
            :selected="Number(valoresIniciaisConsolidados.variavel_categorica_id) === -2147483648"
          >
            Numérica
          </option>
          <optgroup label="Categórica">
            <option
              v-for="variavel, index in listaDeVariaveisCategoricas"
              :key="index"
              :value="variavel.id"
              :title="variavel.descricao ? variavel.descricao : undefined"
              :selected="Number(valoresIniciaisConsolidados.variavel_categorica_id) === variavel.id"
            >
              {{ variavel.titulo }}
            </option>
          </optgroup>
        </select>
      </div>

      <div class="f1 fb20em">
        <label
          class="label"
          for="codigo"
        >Código</label>
        <input
          id="codigo"
          :value="valoresIniciaisConsolidados.codigo"
          class="inputtext light"
          name="codigo"
          type="text"
        >
      </div>
    </div>

    <div class="flex flexwrap end g2 fb100">
      <div class="f1 fb10em">
        <label
          class="label"
          for="plano-setorial-id"
        >
          Plano setorial
        </label>
        <select
          id="plano-setorial-id"
          v-model.number="planoSetorialId"
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
          :disabled="!metasDisponiveis.length"
        >
          <option value="" />
          <option
            v-for="meta in metasDisponiveis"
            :key="meta.id"
            :value="meta.id"
            :selected="Number(valoresIniciaisConsolidados.metas) === meta.id"
            :title="meta.titulo?.length > 36 ? meta.titulo : undefined"
          >
            {{ truncate(meta.titulo, 36) }}
          </option>
        </select>
      </div>

      <div class="f1 fb10em">
        <label
          class="label"
          for="nivel-regionalizacao"
        >
          {{ schema.fields.nivel_regionalizacao?.spec.label }}
        </label>
        <select
          id="nivel-regionalizacao"
          v-model.number="nivelRegionalizacao"
          name="nivel_regionalizacao"
          class="inputtext light"
          @change="regiaoId = null"
        >
          <option :value="null" />
          <option
            v-for="nível in Object.values(niveisRegionalizacao)"
            :key="nível.id"
            :value="nível.id"
            :disabled="!regiõesPorNívelOrdenadas?.[nível.id]?.length"
          >
            {{ nível.nome }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label"
          for="regiao-ids"
        >
          Região
        </label>
        <select
          id="regiao-ids"
          v-model.number="regiaoId"
          name="regiao_id"
          class="inputtext light"
          :aria-busy="regions.loading"
          :disabled="!nivelRegionalizacao"
        >
          <option :value="null" />
          <option
            v-for="regiao in regiõesPorNívelOrdenadas[nivelRegionalizacao]"
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
            :selected="valoresIniciaisConsolidados?.periodicidade === item.valor"
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
          {{ schema.fields.medicao_orgao_id?.spec.label || 'Campo faltando no schema' }}
        </label>
        <select
          id="orgao-id"
          name="medicao_orgao_id"
          class="inputtext light"
          :aria-busy="organs.loading"
          :class="{ error: organs.error }"
        >
          <option value="" />
          <option
            v-for="orgao in órgãosComoLista"
            :key="orgao.id"
            :value="orgao.id"
            :selected="Number(valoresIniciaisConsolidados?.medicao_orgao_id) === orgao.id"
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
            :selected="Number(valoresIniciaisConsolidados.orgao_proprietario_id) === orgao.id"
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
        :value="valoresIniciaisConsolidados.palavra_chave"
        class="inputtext light"
        name="palavra_chave"
        type="search"
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
          :selected="valoresIniciaisConsolidados.ordem_coluna === coluna.valor"
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
          :selected="valoresIniciaisConsolidados.ordem_direcao === direcao.valor"
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
          :selected="Number(valoresIniciaisConsolidados?.ipp) === quantidade"
        >
          {{ quantidade }}
        </option>
      </select>
    </div>
    <button
      type="submit"
      class="btn outline bgnone tcprimary mtauto align-end mlauto mr0"
    >
      Filtrar
    </button>
  </form>
</template>
<script setup lang="ts">
import direcoesDeOrdenacao from '@/consts/direcoesDeOrdenacao';
import { variavelGlobalParaGeracao as schema } from '@/consts/formSchemas';
import niveisRegionalizacao from '@/consts/niveisRegionalizacao';
import periodicidades from '@/consts/periodicidades';
import truncate from '@/helpers/texto/truncate';
import { useAssuntosStore } from '@/stores/assuntosPs.store';
import { usePsMetasStore } from '@/stores/metasPs.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import { useRegionsStore } from '@/stores/regions.store';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store';
import { storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import {
  computed, ref,
} from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
  valoresIniciais: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['enviado']);

const colunasParaOrdenacao = {
  titulo: {
    valor: 'titulo',
    nome: schema.fields.titulo?.spec.label,
  },
  codigo: {
    valor: 'codigo',
    nome: 'Código',
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

const chavesDeValoresValidos = [
  'assuntos',
  'codigo',
  'descricao',
  'ipp',
  'medicao_orgao_id',
  'metas',
  'ordem_coluna',
  'ordem_direcao',
  'orgao_proprietario_id',
  'palavra_chave',
  'periodicidade',
  'titulo',
  'variavel_categorica_id',
];

const assuntosStore = useAssuntosStore();
const MetasStore = usePsMetasStore();
const ÓrgãosStore = useOrgansStore();
const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe as string);
const regionsStore = useRegionsStore();
const variaveisCategoricasStore = useVariaveisCategoricasStore();

const {
  lista: listaDePlanosSetoriais,
  chamadasPendentes: chamadasPendentesDePlanosSetoriais,
  erros: errosDePlanosSetoriais,
} = storeToRefs(planosSetoriaisStore);

const {
  lista: listaDeMetas,
  chamadasPendentes: chamadasPendentesDeMetas,
  metasPorPlano,
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
  regions, regiõesPorNívelOrdenadas,
} = storeToRefs(regionsStore);

const {
  variaveisPositivas: listaDeVariaveisCategoricas,
  chamadasPendentes: chamadasPendentesDeVariaveisCategoricas,
} = storeToRefs(variaveisCategoricasStore);

const pronto = ref(false);

const nivelRegionalizacao: Ref<null | number> = ref(null);
const planoSetorialId: Ref<null | number> = ref(null);
const regiaoId: Ref<null | number> = ref(null);

const valoresIniciaisConsolidados = computed(() => chavesDeValoresValidos.reduce((acc, chave) => {
  acc[chave] = route.query[chave] ?? props.valoresIniciais[chave] ?? '';
  return acc;
}, {} as Record<string, unknown>));

const metasDisponiveis = computed(() => (!planoSetorialId.value
  ? listaDeMetas.value
  : metasPorPlano.value[planoSetorialId.value]
  || []));

async function iniciar() {
  pronto.value = false;

  const promessas = [];

  if (!Array.isArray(organs) && !organs.loading) {
    promessas.push(ÓrgãosStore.getAll());
  }

  if (!Array.isArray(regions) && !regions.loading) {
    promessas.push(regionsStore.getAll());
  }

  if (!listaDeAssuntos.value.length && !chamadasPendentesDeAssuntos.value.lista) {
    promessas.push(assuntosStore.buscarTudo());
  }

  if (!listaDeMetas.value.length && !chamadasPendentesDeMetas.value.lista) {
    promessas.push(MetasStore.buscarTudo());
  }

  if (!listaDePlanosSetoriais.value.length && !chamadasPendentesDePlanosSetoriais.value.lista) {
    promessas.push(planosSetoriaisStore.buscarTudo());
  }

  if (
    !listaDeVariaveisCategoricas.value.length
    && !chamadasPendentesDeVariaveisCategoricas.value.lista
  ) {
    promessas.push(variaveisCategoricasStore.buscarTudo());
  }

  nivelRegionalizacao.value = Number(route.query.nivel_regionalizacao) || 0;
  planoSetorialId.value = Number(route.query.plano_setorial_id) || 0;
  regiaoId.value = Number(route.query.regiao_id) || 0;

  Promise.allSettled(promessas)
    .then(() => {
      pronto.value = true;
    });
}

iniciar();
</script>
<style lang="less" scoped>
.label {
  color: @c300;
}
</style>
