<!-- eslint-disable max-len -->
<template>
  <div class="ciclo-atualizacao-modal-editar">
    <div class="editar-subtitulo flex">
      <svg
        class="editar-subtitulo__icone"
        width="32"
        height="32"
      ><use xlink:href="#i_indicador" /></svg>

      <div class="editar-subtitulo__conteudo">
        <h3 class="editar-subtitulo__conteudo-variavel">
          <strong>{{ emFoco?.variavel.codigo }}</strong> - {{ emFoco?.variavel.titulo }}
        </h3>
      </div>
    </div>

    <form
      class="mt1 flex column"
      @submit="onSubmit"
    >
      <hr>

      <div
        class="formulario"
      >
        <div class="mt2 formulario__item formulario__item--analise_qualitativa">
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
        </div>
      </div>

      <article class="upload-arquivos mt1">
        <UploadArquivos
          :arquivos="arquivosLocais"
          label="ADICIONAR DOCUMENTOS COMPROBATÓRIOS OU COMPLEMENTARES"
          @novo-arquivo="adicionarNovoArquivo"
          @remover-arquivo="removerArquivo"
        />
      </article>

      <article class="valores-variaveis mt4">
        <h2 class="valores-variaveis__titulo">
          Valores de variáveis
        </h2>

        <table class="valores-variaveis-tabela mt4">
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>REFERÊNCIA</th>
              <th>VALOR REALIZADO</th>
              <th v-if="emFoco?.variavel.acumulativa">
                VALOR REALIZADO ACUMULADO
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(variavelDado, variavelDadoIndex) in variaveisDados"
              :key="`variavel-dado--${variavelDadoIndex}-${variavelDado.codigo}`"
            >
              <td class="valores-variaveis-tabela__item valores-variaveis-tabela__item--codigo">
                <div>
                  <strong>
                    <svg
                      width="12"
                      height="12"
                    ><use xlink:href="#i_right" /></svg>

                    {{ variavelDado.codigo.id }}
                  </strong>

                  - {{ variavelDado.codigo.texto }}
                </div>
              </td>

              <td class="valores-variaveis-tabela__item valores-variaveis-tabela__item--referencia">
                <strong>{{ variavelDado.referencia }}</strong>
              </td>

              <td
                class="valores-variaveis-tabela__item valores-variaveis-tabela__item--valor_realizado"
              >
                <Field
                  v-model="variaveisDadosValores[variavelDadoIndex].valor_realizado"
                  :class="[
                    'inputtext light',
                    {'error': temErro(`variaveis_dados[${variavelDadoIndex}].valor_realizado`)}
                  ]"
                  type="number"
                  :name="`variaveis_dados[${variavelDadoIndex}].valor_realizado`"
                  @update:model-value="atualizarVariavelAcululado(variavelDadoIndex, $event)"
                />
              </td>

              <td
                v-if="emFoco?.variavel.acumulativa"
                class="valores-variaveis-tabela__item valores-variaveis-tabela__item--valor_realizado_acumulado"
              >
                <Field
                  :name="`variaveis_dados[${variavelDadoIndex}].valor_realizado_acumulado`"
                  :class="[
                    'inputtext light f1',
                    {'error': temErro(`variaveis_dados[${variavelDadoIndex}].valor_realizado_acumulado`)}
                  ]"
                  type="number"
                  disabled
                />
              </td>

              <Field
                :name="`variaveis_dados[${variavelDadoIndex}].referencia`"
                type="hidden"
                :model-value="variavelDadoIndex"
              />
            </tr>

            <tr class="valores-variaveis-tabela__linha-calculada">
              <td />
              <td />
              <td>{{ valoresCalculados.valor_realizado }}</td>
              <td
                v-if="emFoco?.variavel.acumulativa"
              >
                {{ valoresCalculados.valor_realizado_acumulado }}
              </td>
            </tr>
          </tbody>
        </table>
      </article>

      <button
        class="btn outline center mt3 bgnone tcprimary"
        type="submit"
        :disabled="bloqueado"
      >
        Salvar
      </button>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Field, useForm } from 'vee-validate';

import { useCicloAtualizacaoStore } from '@/stores/cicloAtualizacao.store';

import { cicloAtualizacaoModalEditarSchema as schema } from '@/consts/formSchemas';

import LabelFromYup from '@/components/LabelFromYup.vue';
import UploadArquivos, { ArquivoAdicionado } from '@/components/UploadArquivos.vue';

type VariaveisDados = {
  codigo: {
    id: string
    texto: string
  },
  referencia: string
  valor_realizado: string | null
  valor_realizado_acumulado: string | null
};

type ValoresAcumulados = {
  valor_realizado: number,
  valor_realizado_acumulado: number
};

type Emits = {
  (event: 'enviado'): void
};

const $emit = defineEmits<Emits>();

const $route = useRoute();

const { emFoco, enviarDados, bloqueado } = useCicloAtualizacaoStore();

const valorInicialVariaveis = emFoco?.valores.map((item) => ({
  variavel_id: item.variavel.id,
  valor_realizado: item.valor_realizado,
  valor_realizado_acumulado: item.valor_realizado_acumulado,
}));

const valorInicial = {
  analise_qualitativa: emFoco?.ultima_analise?.analise_qualitativa,
  variaveis_dados: valorInicialVariaveis,
};

const { handleSubmit, errors, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: valorInicial,
});

const variaveisDadosValores = ref(valorInicialVariaveis || []);
const arquivosLocais = ref<ArquivoAdicionado[]>(emFoco?.uploads || []);

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
    valores: valores.variaveis_dados || [],
    pedido_complementacao: undefined,
  });

  $emit('enviado');
});

const variaveisDados = computed<VariaveisDados[]>(() => {
  if (!emFoco) {
    return [];
  }

  return emFoco.valores.map<VariaveisDados>(
    (item) => (
      {
        codigo: {
          id: item.variavel.codigo,
          texto: item.variavel.titulo,
        },
        referencia: item.variavel.periodicidade,
        valor_realizado: item.valor_realizado,
        valor_realizado_acumulado: item.valor_realizado_acumulado,
      }
    ),
  );
});

const valoresCalculados = computed<ValoresAcumulados>(() => {
  if (!variaveisDadosValores.value) {
    return {
      valor_realizado: 0,
      valor_realizado_acumulado: 0,
    };
  }

  return variaveisDadosValores.value.reduce<ValoresAcumulados>((amount, item) => {
    // eslint-disable-next-line no-param-reassign
    amount.valor_realizado += Number(item.valor_realizado);
    // eslint-disable-next-line no-param-reassign
    amount.valor_realizado_acumulado += Number(item.valor_realizado_acumulado);

    return amount;
  }, { valor_realizado: 0, valor_realizado_acumulado: 0 });
});

function adicionarNovoArquivo({ nome_original, download_token, descricao }: ArquivoAdicionado) {
  arquivosLocais.value.push({
    nome_original,
    download_token,
    descricao,
  });
}

function removerArquivo(arquivoIndex: number) {
  arquivosLocais.value.splice(arquivoIndex, 1);
}

function temErro(caminho: string) {
  const erro = errors.value as any;
  if (!erro) {
    return false;
  }

  return erro[caminho];
}

function atualizarVariavelAcululado(variavelIndex: number, valor: string) {
  const valorVariavelInicial = Number(emFoco?.valores[variavelIndex].valor_realizado);
  const valorVariavelAcululadoInicial = Number(
    emFoco?.valores[variavelIndex].valor_realizado_acumulado,
  );
  const novoValor = Number(valor);

  const novoValorAcumulado = (valorVariavelAcululadoInicial - valorVariavelInicial) + novoValor;

  setFieldValue(
    `variaveis_dados[${variavelIndex}].valor_realizado_acumulado` as any,
    novoValorAcumulado,
  );
}
</script>

<style lang="less" scoped>
.editar-subtitulo {
  gap: 19px
}

.editar-subtitulo__icone {
  color: #F2890D;
}

.editar-subtitulo__conteudo-variavel {
  font-size: 20px;
  line-height: 26px;
  margin: 0;
  font-weight: 400;

  strong {
    font-weight: 700;
  }
}

.formulario__item--analise_qualitativa {
  textarea {
    height: 124px;
  }
}

.valores-variaveis__titulo {
  font-size: 20px;
  font-weight: 700;
  line-height: 26px;
  color: #607A9F;
}

.valores-variaveis__subtitulo {
  font-size: 12px;
  font-weight: 700;
  line-height: 15px;
  color: #B8C0CC;
  margin: 0;

  svg {
    margin-right: 2px;
  }
}

.valores-variaveis-tabela {
  width: 100%;

  thead th {
    text-align: left;
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    color: #B8C0CC;
  }

  th, td {
    padding-right: 30px;

    &:last-of-type {
      padding-right: 0;
    }
  }

  tbody {
    tr {
      td {
        padding-bottom: 30px;
      }

      &:nth-last-child(-n+2) {
        td {
          padding-bottom: 0;
        }
      }
    }
  }
}

.valores-variaveis-tabela__item {
  font-size: 12px;
  font-weight: 500;
  line-height: 15px;

  strong {
    font-weight: 700;
  }
}

.valores-variaveis-tabela__item--codigo {
  width: 100%;

  strong {
    display: inline-flex;
  }
}

.valores-variaveis-tabela__item--valor_realizado,
.valores-variaveis-tabela__item--valor_realizado_acumulado {
  input {
    width: 125px;
  }
}

.valores-variaveis-tabela__linha-calculada {
  td {
    padding-top: 5px;
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    text-align: end;
    color: #B8C0CC;
  }
}
</style>
