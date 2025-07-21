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

    <article
      v-if="!temCategorica"
      class="variaveis-configuracoes flex g4 mt3 mb1"
    >
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

    <form class="mt1 flex column">
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

            <SmaeText
              class="inputtext light f1"
              as="textarea"
              name="analise_qualitativa_liberador"
              :disabled="!forumlariosAExibir.liberacao.liberado"
              anular-vazio
              rows="3"
              maxlength="1000"
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

            <SmaeText
              class="inputtext light f1"
              as="textarea"
              name="analise_qualitativa_aprovador"
              :disabled="!forumlariosAExibir.aprovacao.liberado || fase === 'liberacao'"
              anular-vazio
              rows="3"
              maxlength="1000"
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

            <SmaeText
              class="inputtext light f1"
              as="textarea"
              name="pedido_complementacao"
              :disabled="!values.solicitar_complementacao"
              anular-vazio
              rows="3"
              maxlength="1000"
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
          <div class="flex g4">
            <div class="f1 formulario__item formulario__item--valor_realizado">
              <LabelFromYup
                name="valor_realizado"
                :schema="schema"
              />

              <Field
                v-if="!temCategorica"
                class="inputtext light "
                type="text"
                name="valor_realizado"
                :disabled="!forumlariosAExibir.cadastro.liberado"
                @update:model-value="atualizarVariavelAcumulado"
              />
              <Field
                v-else
                class="inputtext light "
                as="select"
                name="valor_realizado"
                :disabled="!forumlariosAExibir.cadastro.liberado"
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
                </option>
              </Field>

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

          <div class="mt2 formulario__item">
            <LabelFromYup
              name="analise_qualitativa"
              :schema="schema"
            />

            <SmaeText
              class="inputtext light f1"
              as="textarea"
              name="analise_qualitativa"
              :disabled="!forumlariosAExibir.cadastro.liberado
                || fase === 'aprovacao'
                || fase === 'liberacao'"
              anular-vazio
              rows="3"
              maxlength="1000"
            />

            <ErrorMessage
              name="analise_qualitativa"
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

      <div class="flex justifycenter mt3 g1">
        <button
          class="btn outline bgnone tcprimary"
          :disabled="bloqueado"
          @click.prevent="submit({ aprovar: false })"
        >
          {{
            values.solicitar_complementacao ?
              'salvar e solicitar complementação' : botoesLabel.salvar
          }}
        </button>

        <button
          v-if="!values.solicitar_complementacao"
          class="btn"
          :disabled="bloqueado"
          @click.prevent="submit({ aprovar: true })"
        >
          {{ botoesLabel.salvarESubmeter }}
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import UploadArquivos, { ArquivoAdicionado } from '@/components/UploadArquivos.vue';
import { useCicloAtualizacaoStore } from '@/stores/cicloAtualizacao.store';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import { cicloAtualizacaoModalAdicionarSchema } from '@/consts/formSchemas';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store';
import useCicloAtualizacao from './composables/useCicloAtualizacao';

type VariavelConfiguracaoItem = {
  label: string
  valor: string | number
};

type Emits = {
  (event: 'enviado'): void
};

const $emit = defineEmits<Emits>();

const cicloAtualizacaoStore = useCicloAtualizacaoStore(useRoute().meta.entidadeMãe);
const variaveisCategoricasStore = useVariaveisCategoricasStore();

const { emFoco, bloqueado, temCategorica } = storeToRefs(cicloAtualizacaoStore);

const {
  fase, fasePosicao, botoesLabel, forumlariosAExibir, dataReferencia, obterValorAnalise,
} = useCicloAtualizacao();

const arquivosLocais = ref<ArquivoAdicionado[]>(emFoco.value?.uploads || []);

function obterVariavelInicial() {
  const valorInicial = {
    solicitar_complementacao: false,
    valor_realizado: emFoco.value?.valores[0]?.valor_realizado,
    valor_realizado_acumulado: emFoco.value?.variavel.acumulativa
      ? emFoco.value?.valores[0]?.valor_realizado_acumulado : 0,
  };

  const analises = obterValorAnalise();

  return {
    ...valorInicial,
    ...analises,
  };
}

const variaveisCategoricasValores = computed(() => {
  if (!variaveisCategoricasStore.emFoco) {
    return [];
  }

  return variaveisCategoricasStore.emFoco.valores;
});

const dataCicloAtualizacao = computed<string | null>(() => (
  dateIgnorarTimezone(dataReferencia)
));

const schema = computed(() => cicloAtualizacaoModalAdicionarSchema(fasePosicao.value));

const variaveis = computed<VariavelConfiguracaoItem[]>(() => {
  if (!emFoco.value) {
    return [];
  }

  return [
    {
      label: 'UNIDADE DE MEDIDA',
      valor: emFoco ? `${emFoco.value.variavel.unidade_medida.sigla} (${emFoco.value.variavel.unidade_medida.descricao})` : '-',
    },
    {
      label: 'NÚMERO DE CASAS DECIMAIS',
      valor: emFoco.value.variavel.casas_decimais,
    },
  ];
});

const { handleSubmit, setFieldValue, values } = useForm({
  validationSchema: schema.value,
  initialValues: obterVariavelInicial(),
});

function atualizarVariavelAcumulado(valor: string) {
  const valorAtual = emFoco.value?.valores[0];

  if (!valorAtual) {
    throw new Error('Valor atual não encontrado');
  }

  const valorVariavelInicial = Number(valorAtual.valor_realizado);
  const valorVariavelAcumuladoInicial = Number(
    valorAtual.valor_realizado_acumulado,
  );
  const novoValor = Number(valor);

  const novoValorAcumulado = (valorVariavelAcumuladoInicial - valorVariavelInicial) + novoValor;

  setFieldValue(
    'valor_realizado_acumulado',
    novoValorAcumulado.toString(),
  );
}

const submit = ({ aprovar = false }) => {
  handleSubmit.withControlled(async (valores: any) => {
    if (!emFoco.value) {
      throw new Error('Erro ao tentar submeter dados');
    }

    let analiseFase = 'analise_qualitativa';
    if (fase.value === 'aprovacao') {
      analiseFase = 'analise_qualitativa_aprovador';
    } else if (fase.value === 'liberacao') {
      analiseFase = 'analise_qualitativa_liberador';
    }

    await cicloAtualizacaoStore.enviarDados({
      variavel_id: emFoco.value.variavel.id,
      analise_qualitativa: !valores.solicitar_complementacao ? valores[analiseFase] : undefined,
      aprovar,
      data_referencia: dataReferencia,
      uploads: arquivosLocais.value,
      valores: [{
        variavel_id: emFoco.value.variavel.id,
        valor_realizado: valores.valor_realizado,
        valor_realizado_acumulado: valores.valor_realizado_acumulado,
      }],
      pedido_complementacao: valores.solicitar_complementacao
        ? valores.pedido_complementacao : undefined,
    });

    $emit('enviado');
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

</style>
