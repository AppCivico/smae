<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import {
  computed, ref, watch,
} from 'vue';

import SmaeLabel from '@/components/camposDeFormulario/SmaeLabel.vue';
import FiltroParaPagina, { Formulario } from '@/components/FiltroParaPagina.vue';
import { FiltroDotacao as schema } from '@/consts/formSchemas';
import prepararParaSelect from '@/helpers/prepararParaSelect';
import { useDotaçãoStore } from '@/stores/dotacao.store';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';

const entidadesProximasStore = useEntidadesProximasStore();
const { chamadasPendentes } = storeToRefs(entidadesProximasStore);

const formulario = ref<Record<string, string>>({});

const ano = ref(new Date().getFullYear());
const dotacaoStore = useDotaçãoStore();

const {
  DotaçãoSegmentos: dotacaoSegmentos,
} = storeToRefs(dotacaoStore);

const dotacaoAtual = computed(() => dotacaoSegmentos.value?.[ano.value] || {});

const projetoAtividade = computed(() => {
  if (!dotacaoAtual.value.projetos_atividades) {
    return [];
  }

  return dotacaoAtual.value.projetos_atividades.map((i) => ({
    ...i,
    codigo: i.codigo.length >= 2
      ? `${i.codigo.slice(0, 1)}.${i.codigo.slice(1)}`
      : i.codigo,
  }));
});

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
        opcoes: prepararParaSelect(projetoAtividade.value, { id: 'codigo', label: ['codigo', 'descricao'] }),
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

/**
 * Recompõe os segmentos de dotação quando há formatação de projeto/atividade.
 *
 * Regra de negócio: O código de projeto/atividade é formatado com ponto decimal
 * (ex: "2.001"), mas na dotação completa deve ser tratado como um único segmento.
 * Quando o usuário digita uma dotação com 7+ segmentos, significa que os segmentos
 * 5 e 6 (projeto/atividade) foram divididos pelo ponto, e precisam ser reagrupados.
 *
 * Exemplo:
 *   Entrada: ['12', '34', '56', '78', '90', '2', '001', '12345678', ...]
 *   Saída:   ['12', '34', '56', '78', '90', '2.001', '12345678', ...]
 *
 * @param segmentos - Array de segmentos da dotação separados por ponto
 * @returns Array com segmentos ajustados, reagrupando projeto/atividade se necessário
 */
function recomporSegmentosDotacao(segmentos: string[]): string[] {
  // Se há 7 ou mais segmentos, os índices 5 e 6 são partes do projeto/atividade
  // que precisam ser reagrupados com ponto entre eles
  if (segmentos.length >= 7) {
    const inicio = segmentos.slice(0, 5);
    const projetoAtividadeRecomposto = `${segmentos[5]}.${segmentos[6]}`;
    const fim = segmentos.slice(7);
    return [...inicio, projetoAtividadeRecomposto, ...fim];
  }

  return segmentos;
}

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
      if (texto[texto.length - 1] !== '.') {
        texto += '.';
      }
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
    const segmentosAjustados = recomporSegmentosDotacao(valorSeparado);

    const dados = camposLista.value.reduce((agrupado, item, itemPosicao) => ({
      ...agrupado,
      [item]: segmentosAjustados[itemPosicao],
    }), {});

    const ultimoCampo = camposLista.value[camposLista.value.length - 1];
    if (dados[ultimoCampo]) {
      adicionarPonto = false;
    }

    formulario.value = dados;
  },
});

function filtrarDotacao() {
  entidadesProximasStore.buscarPorDotacao(dotacaoEComplemento.value);
}

async function resetarPesquisa() {
  await filtrarDotacao();
}

defineExpose({
  resetarPesquisa,
});

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
        <option
          v-for="anoOpcao in [2025, 2024, 2023, 2022]"
          :key="`ano--${anoOpcao}`"
          :value="anoOpcao"
        >
          {{ anoOpcao }}
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
