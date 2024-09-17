<template>
  <div class="ciclo-atualizacao-modal-adicionar">
    <div class="adicionar-subtitulo flex">
      <svg
        class="adicionar-subtitulo__icone"
        width="32"
        height="32"
      ><use xlink:href="#i_indicador" /></svg>

      <div class="adicionar-subtitulo__conteudo">
        <h3 class="adicionar-subtitulo__conteudo-variavel">
          {{ emFoco?.variavel.titulo }}
        </h3>

        <h4 class="adicionar-subtitulo__conteudo-data">
          {{ dataCicloAtualizacao }}
        </h4>
      </div>
    </div>

    <article class="variaveis-configuracoes flex g4 mt3 mb1">
      <div
        v-for="(variavelItem, variavelItemIndex) in variaveis"
        :key="`variavel-configuracao-item--${variavelItemIndex}`"
        class="variaveis-configuracoes__item"
      >
        <h5 class="variaveis-configuracoes__item-label">
          {{ variavelItem.label }}
        </h5>

        <h6 class="variaveis-configuracoes__item-valor">
          {{ variavelItem.valor }}
        </h6>
      </div>
    </article>

    <hr>

    <form
      class="mt1 flex column"
      @submit="onSubmit"
    >
      <article class="formulario mt1">
        <div class="flex g4">
          <div class="f1 formulario__item formulario__item--valor_realizado">
            <LabelFromYup
              name="valor_realizado"
              :schema="schema"
            />
            <Field
              class="inputtext light "
              type="text"
              name="valor_realizado"
              @update:model-value="atualizarVariavelAcululado"
            />

            <ErrorMessage
              name="valor_realizado"
            />
          </div>

          <div
            v-if="emFoco?.variavel.acumulativa"
            :class="[
              'f1 formulario__item formulario__item--valor_realizado_acumulado',
              'formulario__item--disabled'
            ]"
          >
            <LabelFromYup
              name="valor_realizado_acumulado"
              :schema="schema"
            />
            <Field
              class="inputtext light f1"
              type="text"
              name="valor_realizado_acumulado"
              disabled
            />

            <ErrorMessage
              name="valor_realizado_acumulado"
            />
          </div>
        </div>

        <div class="mt2  formulario__item formulario__item--analise_qualitativa">
          <LabelFromYup
            name="analise_qualitativa"
            :schema="schema"
          />

          <Field
            :style="{ height: '124px'}"
            class="inputtext light f1"
            as="textarea"
            name="analise_qualitativa"
          />

          <ErrorMessage
            name="analise_qualitativa"
          />
        </div>
      </article>

      <article class="upload-arquivos mt1">
        <UploadArquivos
          :arquivos="arquivosLocais"
          label="ADICIONAR DOCUMENTOS COMPROBATÓRIOS OU COMPLEMENTARES"
          @novo-arquivo="adicionarNovoArquivo"
          @remover-arquivo="removerArquivo"
        />
      </article>

      <button
        class="btn outline center mt3 bgnone tcprimary"
        type="submit"
      >
        Salvar
      </button>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { ErrorMessage, Field, useForm } from 'vee-validate';

import { useRoute } from 'vue-router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useCicloAtualizacaoStore } from '@/stores/cicloAtualizacao.store';

import { cicloAtualizacaoModalAdicionarSchema as schema } from '@/consts/formSchemas';

import LabelFromYup from '@/components/LabelFromYup.vue';
import UploadArquivos, { ArquivoAdicionado } from '@/components/UploadArquivos.vue';

type VariavelConfiguracaoItem = {
  label: string
  valor: string | number
};

type Emits = {
  (event: 'enviado'): void
};

const $emit = defineEmits<Emits>();

const $route = useRoute();

const { emFoco, enviarDados } = useCicloAtualizacaoStore();

const arquivosLocais = ref<ArquivoAdicionado[]>(emFoco?.uploads || []);

const valorInicial = {
  valor_realizado: emFoco?.valores[0]?.valor_realizado,
  valor_realizado_acumulado: emFoco?.valores[0]?.valor_realizado_acumulado,
  analise_qualitativa: emFoco?.ultima_analise?.analise_qualitativa,
};

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: valorInicial,
});

function atualizarVariavelAcululado(valor: string) {
  const valorAtual = emFoco?.valores[0];

  if (!valorAtual) {
    throw new Error('Valor atual não encontrado');
  }

  const valorVariavelInicial = Number(valorAtual.valor_realizado);
  const valorVariavelAcululadoInicial = Number(
    valorAtual.valor_realizado_acumulado,
  );
  const novoValor = Number(valor);

  const novoValorAcumulado = (valorVariavelAcululadoInicial - valorVariavelInicial) + novoValor;

  setFieldValue(
    'valor_realizado_acumulado',
    novoValorAcumulado.toString(),
  );
}

const onSubmit = handleSubmit(async (valores) => {
  if (!emFoco) {
    throw new Error('Erro ao tentar submeter dados');
  }

  await enviarDados({
    variavel_id: emFoco.variavel.id,
    analise_qualitativa: valores.analise_qualitativa,
    aprovar: false,
    data_referencia: $route.params.dataReferencia as string,
    uploads: arquivosLocais.value,
    valores: [{
      variavel_id: emFoco.variavel.id,
      valor_realizado: valores.valor_realizado,
      valor_realizado_acumulado: valores.valor_realizado_acumulado,
    }],
    pedido_complementacao: undefined,
  });

  $emit('enviado');
});

function adicionarNovoArquivo({ nome_original, download_token }: ArquivoAdicionado) {
  arquivosLocais.value.push({
    nome_original,
    download_token,
  });
}

function removerArquivo(arquivoIndex: number) {
  arquivosLocais.value.splice(arquivoIndex, 1);
}

const dataCicloAtualizacao = computed<string>(() => (
  format(new Date($route.params.dataReferencia as string), 'MMMM yyyy', { locale: ptBR })
));

const variaveis = computed<VariavelConfiguracaoItem[]>(() => {
  if (!emFoco) {
    return [];
  }

  return [
    {
      label: 'UNIDADE DE MEDIDA',
      valor: emFoco ? `${emFoco.variavel.unidade_medida.sigla} (${emFoco.variavel.unidade_medida.descricao})` : '-',
    },
    {
      label: 'NÚMERO DE CASAS DECIMAIS',
      valor: emFoco?.variavel.casas_decimais,
    },
  ];
});

</script>

<style lang="less" scoped>
.adicionar-subtitulo {
  gap: 19px
}

.adicionar-subtitulo__icone {
  color: #F2890D;
}

.adicionar-subtitulo__conteudo-variavel, .adicionar-subtitulo__conteudo-data {
  font-size: 20px;
  line-height: 26px;
  margin: 0;
}

.adicionar-subtitulo__conteudo-variavel {
  font-weight: 700;
}

.adicionar-subtitulo__conteudo-data {
  font-weight: 400;
}

.variaveis-configuracoes__item-label, .variaveis-configuracoes__item-valor {
  font-size: 14px;
  line-height: 18px;
  margin: 0;
}

.variaveis-configuracoes__item-label {
  font-weight: 700;
  color: #B8C0CC;
  text-transform: uppercase;
}

.variaveis-configuracoes__item-valor {
  font-weight: 400;
  color: #233B5C;
}

.formulario__item--valor_realizado_acumulado.formulario__item--disabled {
  opacity: 0.2;
}

.formulario__item--analise_qualitativa {
  textarea {
    height: 124px;
  }
}
</style>
