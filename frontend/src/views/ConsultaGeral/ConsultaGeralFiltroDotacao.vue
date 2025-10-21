<script lang="ts" setup>
import {
  computed, ref, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import FiltroParaPagina, { Formulario } from '@/components/FiltroParaPagina.vue';
import { FiltroDotacao as schema } from '@/consts/formSchemas';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import { useDotaçãoStore } from '@/stores/dotacao.store';
import prepararParaSelect from '@/helpers/prepararParaSelect';
import SmaeLabel from '@/components/camposDeFormulario/SmaeLabel.vue';

const entidadesProximasStore = useEntidadesProximasStore();
const { chamadasPendentes } = storeToRefs(entidadesProximasStore);

const formulario = ref({});

const ano = ref(2025);
const dotacaoStore = useDotaçãoStore();

const {
  DotaçãoSegmentos: dotacaoSegmentos,
  // chamadasPendentes: dotacaoChamadasPendentes,
} = storeToRefs(dotacaoStore);

const dotacaoAtual = computed(() => dotacaoSegmentos.value?.[ano.value] || {});

const camposDeFiltro = computed<Formulario>(() => [
  {
    campos: {
      orgao_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.orgaos, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
      unidade_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(
          dotacaoAtual.value?.unidades?.filter(
            (unidade) => formulario.value.orgao_id === unidade.cod_orgao,
          ),
          { id: 'codigo', label: ['codigo', 'descricao'] },
        ),
      },
      funcao_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.funcoes, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
      subfuncao_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.subfuncoes, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
      programa_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.programas, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
    },
  },
  {
    campos: {
      projeto_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.projetos_atividades, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
      conta_despesa: {
        tipo: 'numeric',
        atributos: { maxlength: 8, minlength: 8 },
      },
      despesa_fonte: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.fonte_recursos, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
    },
  },
  {
    campos: {
      exercicio_fonte_recurso: {
        tipo: 'numeric',
        atributos: { maxlength: 1, minlength: 1 },
      },
      exercicio_fonte: {
        tipo: 'numeric',
        atributos: { maxlength: 3, minlength: 3 },
      },
      execucao_orcamentaria: {
        tipo: 'numeric',
        atributos: { maxlength: 4, minlength: 4 },
      },
      origem_recurso: {
        tipo: 'numeric',
        atributos: { maxlength: 1, minlength: 1 },
      },
    },
  },
]);

const camposLista = computed<string[]>(
  () => camposDeFiltro.value.reduce<string[]>((agrupado, linha) => {
    const campos = Object.keys(linha.campos);

    return [...agrupado, ...campos];
  }, []),
);

let adicionarPonto = false;
const dotacaoEComplemento = computed<string>({
  get: () => {
    let faltandoCampo = false;
    const dados: unknown[] = [];

    camposLista.value.forEach((item) => {
      if (faltandoCampo) {
        return;
      }

      const valorItem = formulario.value[item];
      if (!valorItem) {
        faltandoCampo = true;
        return;
      }

      dados.push(valorItem);
    });

    let texto = dados.join('.');

    if (adicionarPonto) {
      texto += '.';
    }

    return texto;
  },
  set(valor) {
    if (valor[valor.length - 1] === '.') {
      adicionarPonto = true;
    } else {
      adicionarPonto = false;
    }

    const valorSeparado = valor.split('.');

    const dados = camposLista.value.reduce((agrupado, item, itemPosicao) => ({
      ...agrupado,
      [item]: valorSeparado[itemPosicao],
    }), {});

    const ultimoCampo = camposLista.value[camposLista.value.length - 1];
    if (dados[ultimoCampo]) {
      adicionarPonto = false;
    }

    formulario.value = dados;
  },
});

function filtrarDotacao() {
  console.log(dotacaoEComplemento.value);

  entidadesProximasStore.buscarPorDotacao(dotacaoEComplemento.value);
}

watch(ano, () => {
  dotacaoStore.getDotaçãoSegmentos(ano.value);
}, { immediate: true });
</script>

<template>
  <div class="flex g2 flexwrap fg999">
    <div class="align-end">
      <SmaeLabel name="ano">
        ano
      </SmaeLabel>

      <select
        id="ano"
        v-model="ano"
        class="inputtext light mb1"
        type="text"
      >
        <option :value="2025">
          2025
        </option>
        <option :value="2024">
          2024
        </option>
        <option :value="2023">
          2023
        </option>
        <option :value="2022">
          2022
        </option>
      </select>
    </div>

    <div class="f1 align-end">
      <SmaeLabel name="dotacao">
        Dotação
      </SmaeLabel>

      <input
        id="dotacao"
        v-model="dotacaoEComplemento"
        class="inputtext light mb1"
        type="text"
      >
    </div>
  </div>

  <FiltroParaPagina
    v-model="formulario"
    class="mb2"
    :schema="schema"
    :formulario="camposDeFiltro"
    :carregando="chamadasPendentes.buscaDotacao"
    :bloqueado="!ano"
    nao-emitir-query
    @filtro="filtrarDotacao"
  />
</template>
