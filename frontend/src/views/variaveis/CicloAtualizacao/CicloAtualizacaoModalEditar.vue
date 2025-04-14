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

        <h4 class="editar-subtitulo__conteudo-data">
          {{ dataCicloAtualizacao }}
        </h4>
      </div>
    </div>

    <form
      class="mt1 flex column"
      @submit.prevent="enviando && !Object.keys(errors).length && validarEEnviar({ aprovar: false })"
    >
      <hr>

      <section :class="`formularios formularios--${fase}`">
        <article
          v-if="forumlariosAExibir.liberacao.exibir"
          class="mt2 formulario formulario--liberacao"
        >
          <div class="formulario__item">
            <LabelFromYup
              name="analise_qualitativa_liberador"
              :schema="schema"
            />

            <Field
              class="inputtext light f1"
              as="textarea"
              name="analise_qualitativa_liberador"
              :disabled="!forumlariosAExibir.liberacao.liberado"
            />

            <ErrorMessage
              name="analise_qualitativa_liberador"
            />
          </div>
        </article>

        <article
          v-if="forumlariosAExibir.aprovacao.exibir"
          class="mt2 formulario formulario--aprovacao"
        >
          <div class="formulario__item">
            <LabelFromYup
              name="analise_qualitativa_aprovador"
              :schema="schema"
            />

            <Field
              class="inputtext light f1"
              as="textarea"
              name="analise_qualitativa_aprovador"
              :disabled="!forumlariosAExibir.aprovacao.liberado || fase === 'liberacao'"
            />

            <ErrorMessage
              name="analise_qualitativa_aprovador"
            />
          </div>
        </article>

        <article
          v-if="fase !== 'cadastro'"
          class="mt2 formulario formulario--complementacao"
        >
          <div class="flex g025 center formulario__item">
            <Field
              class="inputcheckbox"
              type="checkbox"
              name="solicitar_complementacao"
              :value="true"
              :unchecked-value="false"
            />

            <LabelFromYup
              class="mb0"
              name="solicitar_complementacao"
              :schema="schema"
            />
          </div>

          <div class="formulario__item mt1">
            <LabelFromYup
              name="pedido_complementacao"
              :schema="schema"
            />

            <Field
              class="inputtext light f1"
              as="textarea"
              name="pedido_complementacao"
              :disabled="!values.solicitar_complementacao"
            />

            <ErrorMessage
              name="pedido_complementacao"
            />
          </div>
        </article>

        <article
          v-if="forumlariosAExibir.cadastro.exibir"
          class="mt2 formulario formulario--cadastro mt1"
        >
          <div class="mt2 formulario__item">
            <LabelFromYup
              name="analise_qualitativa"
              :schema="schema"
            />

            <Field
              class="inputtext light f1"
              as="textarea"
              name="analise_qualitativa"
              :disabled="!forumlariosAExibir.cadastro.liberado
                || fase === 'aprovacao'
                || fase === 'liberacao'"
            />
          </div>
        </article>
      </section>

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

        <AuxiliarDePreenchimento>
          <div class="flex g2 end mb1">
            <div class="f1">
              <label class="label">Valor a aplicar</label>
              <input
                v-if="!temCategorica"
                v-model="valorPadrao"
                type="number"
                class="inputtext light mb1"
              >
              <select
                v-else
                v-model="valorPadrao"
                class="inputtext light"
              >
                <option value="">
                  -
                </option>

                <option
                  v-for="variaveisCategoricasValor in variaveisCategoricasValores"
                  :key="`ciclo-variavel-categorica--${variaveisCategoricasValor.id}`"
                  :value="variaveisCategoricasValor.valor_variavel"
                >
                  {{ variaveisCategoricasValor.titulo }}
                  {{ variaveisCategoricasValor.descricao && truncate(`- ${variaveisCategoricasValor.descricao}`, 55) }}
                </option>
              </select>
            </div>
            <button
              type="button"
              class="f0 mb1 btn bgnone outline tcprimary"
              @click="preencherVaziosCom(valorPadrao)"
            >
              Preencher vazios
            </button>

            <button
              type="reset"
              form="form"
              class="f0 mb1 pl0 pr0 btn bgnone"
              @click="limparFormulario"
            >
              &times; limpar tudo
            </button>

            <button
              type="reset"
              class="f0 mb1 pl0 pr0 btn bgnone"
              @click.prevent="restaurarFormulario"
            >
              &excl; restaurar
            </button>
          </div>
        </AuxiliarDePreenchimento>

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
                  v-if="!temCategorica"
                  v-model="variaveisDadosValores[variavelDadoIndex].valor_realizado"
                  :class="[
                    'inputtext light',
                    {'error': temErro(`variaveis_dados[${variavelDadoIndex}].valor_realizado`)}
                  ]"
                  type="number"
                  :name="`variaveis_dados[${variavelDadoIndex}].valor_realizado`"
                  :disabled="!forumlariosAExibir.cadastro.liberado"
                  @update:model-value="atualizarVariavelAcululado(variavelDadoIndex, $event)"
                />
                <Field
                  v-else
                  :class="[
                    'inputtext light',
                    {'error': temErro(`variaveis_dados[${variavelDadoIndex}].valor_realizado`)}
                  ]"
                  as="select"
                  :name="`variaveis_dados[${variavelDadoIndex}].valor_realizado`"
                >
                  <option value="">
                    -
                  </option>

                  <option
                    v-for="variaveisCategoricasValor in variaveisCategoricasValores"
                    :key="`ciclo-variavel-categorica--${variaveisCategoricasValor.id}`"
                    :value="variaveisCategoricasValor.valor_variavel"
                  >
                    {{ variaveisCategoricasValor.titulo }}
                    {{ variaveisCategoricasValor.descricao && truncate(`- ${variaveisCategoricasValor.descricao}`, 55) }}
                  </option>
                </Field>
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
                :name="`variaveis_dados[${variavelDadoIndex}].variavel_id`"
                type="hidden"
              />
            </tr>

            <tr
              v-if="!temCategorica"
              class="valores-variaveis-tabela__linha-calculada"
            >
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

      <SmaeFieldsetSubmit :erros="errors">
        <button
          type="button"
          class="btn outline bgnone tcprimary"
          :disabled="bloqueado"
          :aria-busy="enviando"
          @click.prevent="enviar({ aprovar: false })"
        >
          {{
            values.solicitar_complementacao ?
              'salvar e solicitar complementação' : botoesLabel.salvar
          }}
        </button>

        <button
          v-if="!values.solicitar_complementacao"
          type="submit"
          class="btn"
          :disabled="bloqueado"
          :aria-disabled="!!Object.keys(errors).length"
          :aria-busy="enviando"
          @click.prevent="!Object.keys(errors).length && validarEEnviar({ aprovar: true })"
        >
          {{ botoesLabel.salvarESubmeter }}
        </button>
      </SmaeFieldsetSubmit>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { useCicloAtualizacaoStore } from '@/stores/cicloAtualizacao.store';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store';
import truncate from '@/helpers/texto/truncate';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import { cicloAtualizacaoModalEditarSchema } from '@/consts/formSchemas';
import UploadArquivos, { ArquivoAdicionado } from '@/components/UploadArquivos.vue';
import AuxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';
import { useRoute } from 'vue-router';
import useCicloAtualizacao from './composables/useCicloAtualizacao';

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

const cicloAtualizacaoStore = useCicloAtualizacaoStore(useRoute().meta.entidadeMãe);
const variaveisCategoricasStore = useVariaveisCategoricasStore();

const { emFoco, bloqueado, temCategorica } = storeToRefs(cicloAtualizacaoStore);

const {
  fase, forumlariosAExibir, botoesLabel, fasePosicao, dataReferencia, obterValorAnalise,
} = useCicloAtualizacao();

const valorInicialVariaveis = emFoco.value?.valores.map((item) => ({
  variavel_id: item.variavel.id,
  valor_realizado: item.valor_realizado,
  valor_realizado_acumulado: emFoco.value?.variavel.acumulativa ? item.valor_realizado_acumulado : '0',
}));

function obterVariavelInicial() {
  const valorInicial = {
    solicitar_complementacao: false,
    variaveis_dados: valorInicialVariaveis,
  };

  const analises = obterValorAnalise();

  return {
    ...valorInicial,
    ...analises,
  };
}
const enviando = ref(false);

const dataCicloAtualizacao = computed<string | null>(() => (
  dateIgnorarTimezone(dataReferencia)
));

const schema = computed(() => cicloAtualizacaoModalEditarSchema(fasePosicao.value));

const {
  handleSubmit, errors, setFieldValue, values, validateField,
} = useForm({
  validationSchema: schema,
  initialValues: obterVariavelInicial(),
});

const valorPadrao = ref<string>('');
const variaveisDadosValores = ref(valorInicialVariaveis || []);
const arquivosLocais = ref<ArquivoAdicionado[]>(emFoco.value?.uploads || []);

const variaveisCategoricasValores = computed(() => {
  if (!variaveisCategoricasStore.emFoco) {
    return [];
  }

  return variaveisCategoricasStore.emFoco.valores;
});

const variaveisDados = computed<VariaveisDados[]>(() => {
  if (!emFoco.value) {
    return [];
  }

  return emFoco.value.valores.map<VariaveisDados>(
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

const enviar = async ({ aprovar = false }) => {
  if (!emFoco.value) {
    throw new Error('Erro ao tentar submeter dados');
  }

  enviando.value = true;

  let analiseFase = 'analise_qualitativa';
  if (fase.value === 'aprovacao') {
    analiseFase = 'analise_qualitativa_aprovador';
  } else if (fase.value === 'liberacao') {
    analiseFase = 'analise_qualitativa_liberador';
  }

  const dados = {
    variavel_id: emFoco.value.variavel.id,
    analise_qualitativa: !values.solicitar_complementacao
      ? values[analiseFase]
      : undefined,
    aprovar,
    data_referencia: dataReferencia,
    uploads: arquivosLocais.value,
    valores: values.variaveis_dados || [],
    pedido_complementacao: values.solicitar_complementacao
      ? values.pedido_complementacao : undefined,
  };

  await cicloAtualizacaoStore.enviarDados(dados);

  enviando.value = false;

  $emit('enviado');
};

const validarEEnviar = ({ aprovar = false }) => {
  handleSubmit(() => {
    enviar({ aprovar });
  })();
};

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
  const valorVariavelInicial = Number(emFoco.value?.valores[variavelIndex].valor_realizado);
  const valorVariavelAcululadoInicial = Number(
    emFoco.value?.valores[variavelIndex].valor_realizado_acumulado,
  );
  const novoValor = Number(valor);

  const novoValorAcumulado = (valorVariavelAcululadoInicial - valorVariavelInicial) + novoValor;

  setFieldValue(
    `variaveis_dados[${variavelIndex}].valor_realizado_acumulado` as any,
    novoValorAcumulado,
  );
}

function preencherVaziosCom(valor: number | string) {
  if (!emFoco.value) {
    throw new Error('Erro ao tentar preencher vazios');
  }

  emFoco.value.valores.forEach((item, itemIndex) => {
    if (values.variaveis_dados && values.variaveis_dados[itemIndex].valor_realizado) {
      return;
    }

    setFieldValue(
      `variaveis_dados[${itemIndex}].valor_realizado` as any,
      valor,
    );

    validateField(`variaveis_dados[${itemIndex}].valor_realizado` as any);
  });
}

function limparFormulario() {
  if (!emFoco.value) {
    throw new Error('Erro ao tentar limpar formulario');
  }

  emFoco.value.valores.forEach((item, itemIndex) => {
    setFieldValue(
      `variaveis_dados[${itemIndex}].valor_realizado` as any,
      '',
    );
  });
}

function restaurarFormulario() {
  if (!emFoco.value) {
    throw new Error('Erro ao tentar limpar formulario');
  }

  emFoco.value.valores.forEach((item, itemIndex) => {
    setFieldValue(
      `variaveis_dados[${itemIndex}].valor_realizado` as any,
      item.valor_realizado,
    );
  });
}
</script>

<style lang="less" scoped>
.editar-subtitulo {
  gap: 19px
}

.editar-subtitulo__icone {
  color: #F2890D;
}

.editar-subtitulo__conteudo-variavel, .editar-subtitulo__conteudo-data {
  font-size: 20px;
  line-height: 26px;
  margin: 0;

  strong {
    font-weight: 700;
  }
}

.editar-subtitulo__conteudo-variavel {
    font-weight: 400;

}

.editar-subtitulo__conteudo-data {
  font-weight: 700;
}

.formularios {
  display: grid;
}

.formularios--liberacao {
  grid-template-areas:
    'liberacao'
    'complementacao'
    'aprovacao'
    'cadastro'
  ;;
}
.formularios--aprovacao {
  grid-template-areas:
    'aprovacao'
    'complementacao'
    'cadastro'
  ;
}
.formularios--cadastro {
  display: block;
}

.formulario--liberacao {
  grid-area: liberacao;
}
.formulario--aprovacao {
  grid-area: aprovacao;
}
.formulario--complementacao {
  grid-area: complementacao;
}
.formulario--cadastro {
  grid-area: cadastro;
}

.formulario__item {
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
