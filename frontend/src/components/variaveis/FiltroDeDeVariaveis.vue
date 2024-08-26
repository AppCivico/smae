<template>
  <form
    class="flex flexwrap g2 mb2 fb100"
    :aria-busy="!pronto"
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
          <option value="" />
          <option
            v-for="assuntos in listaDeAssuntos"
            :key="assuntos.id"
            :value="assuntos.id"
            :selected="Number($props.valoresIniciais.assuntos) === assuntos.id"
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
          v-model="descricao"
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
          v-model="titulo"
          class="inputtext light"
          name="titulo"
          type="text"
        >
      </div>

      <div class="f1 fb20em">
        <label
          class="label"
          for="codigo"
        >Código</label>
        <input
          id="codigo"
          v-model="codigo"
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
            :selected="Number($props.valoresIniciais.plano_setorial_id) === plano.id"
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
            :selected="Number($props.valoresIniciais.meta_id) === meta.id"
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
            :selected="$props.valoresIniciais.periodicidade === item.valor"
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
            :selected="Number($props.valoresIniciais.orgao_id) === orgao.id"
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
            :selected="Number($props.valoresIniciais.orgao_proprietario_id) === orgao.id"
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
        v-model="palavraChave"
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
          :selected="$props.valoresIniciais.ordem_coluna === coluna.valor"
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
          :selected="$props.valoresIniciais.ordem_direcao === direcao.valor"
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
          :selected="Number($props.valoresIniciais.ipp) === quantidade"
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
<script setup>
import direcoesDeOrdenacao from '@/consts/direcoesDeOrdenacao';
import { variavelGlobalParaGeracao as schema } from '@/consts/formSchemas';
import niveisRegionalizacao from '@/consts/niveisRegionalizacao';
import periodicidades from '@/consts/periodicidades';
import truncate from '@/helpers/truncate';
import { useAssuntosStore } from '@/stores/assuntosPs.store';
import { usePsMetasStore } from '@/stores/metasPs.store.ts';
import { useOrgansStore } from '@/stores/organs.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { useRegionsStore } from '@/stores/regions.store';
import { storeToRefs } from 'pinia';
import {
  computed, onUnmounted, ref, watch,
} from 'vue';

const props = defineProps({
  ariaBusy: {
    type: Boolean,
    default: false,
  },
  valoresIniciais: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['enviado']);

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
    nome: schema.fields.assuntos?.spec.label || 'campo faltando no schema',
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
    nome: 'Região',
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

const pronto = ref(false);

const codigo = ref('');
const descricao = ref('');
const nivelRegionalizacao = ref(null);
const palavraChave = ref('');
const planoSetorialId = ref(null);
const regiaoId = ref(null);
const titulo = ref('');

const metasDisponiveis = computed(() => (!planoSetorialId.value
  ? listaDeMetas.value
  : metasPorPlano.value[planoSetorialId.value]
  || []));

async function iniciar() {
  pronto.value = false;

  const promessas = [
    assuntosStore.buscarTudo(),
    MetasStore.buscarTudo(),
    ÓrgãosStore.getAll(),
    planosSetoriaisStore.buscarTudo(),
    regionsStore.getAll(),
  ];

  codigo.value = props.valoresIniciais.codigo || '';
  descricao.value = props.valoresIniciais.descricao || '';
  nivelRegionalizacao.value = Number(props.valoresIniciais.nivel_regionalizacao || 0);
  palavraChave.value = props.valoresIniciais.palavra_chave || '';
  planoSetorialId.value = Number(props.valoresIniciais.plano_setorial_id || 0);
  regiaoId.value = Number(props.valoresIniciais.regiao_id || 0);
  titulo.value = props.valoresIniciais.titulo || '';

  Promise.allSettled(promessas)
    .then(() => {
      pronto.value = true;
    });
}

onUnmounted(() => {
  assuntosStore.$reset();
  MetasStore.$reset();
  ÓrgãosStore.$reset();
  planosSetoriaisStore.$reset();
  regionsStore.$reset();
});

watch(() => props.valoresIniciais, () => {
  iniciar();
}, { immediate: true });
</script>
<style lang="less" scoped>
.label {
  color: @c300;
}
</style>
