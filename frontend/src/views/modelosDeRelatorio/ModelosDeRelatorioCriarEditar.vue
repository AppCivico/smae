<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, FieldArray, useForm,
} from 'vee-validate';
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { useRouter } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import ListaReordenavel from '@/components/ListaReordenavel.vue';
import FONTES_POR_SISTEMA from '@/consts/fontesDeRelatoriosPorSistema';
import schema from '@/consts/formSchemas/modelosDeRelatorio';
import escaparDaRota from '@/helpers/escaparDaRota';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useModelosDeRelatorioStore } from '@/stores/modelosDeRelatorio.store';

const props = defineProps({
  modelosDeRelatorioId: {
    type: Number,
    default: 0,
  },
});

const router = useRouter();
const alertStore = useAlertStore();

const { sistemaEscolhido } = useAuthStore();
const modelosDeRelatorioStore = useModelosDeRelatorioStore(sistemaEscolhido);

const fontesDoSistema = computed(
  () => Object.values(FONTES_POR_SISTEMA[sistemaEscolhido] || {}),
);

const {
  emFoco, chamadasPendentes,
} = storeToRefs(modelosDeRelatorioStore);

const valoresIniciais = computed(() => {
  if (props.modelosDeRelatorioId && emFoco.value?.id) {
    return {
      nome: emFoco.value.nome || '',
      descricao: emFoco.value.descricao || '',
      fonte: emFoco.value.fonte,
      config: {
        xlsx_tipado: emFoco.value.config?.xlsx_tipado ?? true,
        arquivos: (emFoco.value.config?.arquivos || []).map((arquivo) => ({
          arquivo: arquivo.arquivo,
          colunas: arquivo.colunas?.map((coluna) => ({
            coluna: coluna.coluna,
            label: coluna.label || '',
          })) || [],
          incluir: arquivo.incluir ?? true,
          order_by: arquivo.order_by || [],
        })),
      },
    };
  }

  return {
    nome: '',
    descricao: '',
    fonte: '',
    config: {
      xlsx_tipado: true,
      arquivos: [],
    },
  };
});

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

// Arquivos declarados pelo schema da fonte escolhida (nome/label/colunas disponíveis), indexados
// por nome do arquivo — usado só pra desenhar o formulário (o que é enviado ao salvar vem de
// `values.config.arquivos`). O hashtable e o cache por fonte vivem no getter `arquivosPorNome`
// da store.
const arquivosDaFontePorNome = computed(
  () => modelosDeRelatorioStore.arquivosPorNome(values.fonte),
);

// Força o remount do FieldArray de `arquivos` sempre que ele é reconstruído do zero. Como
// `colunas` já vem toda carregada de uma vez (`buscarFontes`), trocar de fonte não alterna
// `chamadasPendentes.colunas` — o `v-if`/`v-else` do loading não desmonta o FieldArray sozinho —,
// e sem esse remount o array interno de `fields` do vee-validate fica dessincronizado com os
// novos valores, causando `campoDeColuna.value` undefined.
const chaveDosArquivos = ref(0);

function obterInfoDoArquivo(arquivo) {
  return arquivosDaFontePorNome.value[arquivo];
}

// Colunas travadas (`customizavel: false`) precisam sempre estar na seleção e não podem ser
// renomeadas — a linha correspondente fica travada em vez de permitir remover/renomear.
function colunaEhTravada(arquivo, nomeDaColuna) {
  const coluna = obterInfoDoArquivo(arquivo)?.colunas.find((item) => item.name === nomeDaColuna);
  // `=== false` (não `!coluna.customizavel`): a API já teve versões que omitem esse campo, e a
  // ausência deve cair no default documentado no backend (`customizavel` ausente = true = não
  // travada), não travar tudo por causa de um `undefined`.
  return coluna?.customizavel === false;
}

// A ordenação aceita qualquer coluna do schema, mesmo uma que a pessoa não incluiu em "Colunas
// exportadas" — sinaliza isso agrupando essas colunas à parte no select (e com um aviso quando
// uma delas está escolhida).
function colunaEstaNoArquivo(colunasDoArquivo, nomeDaColuna) {
  return (colunasDoArquivo || []).some((coluna) => coluna.coluna === nomeDaColuna);
}

// Recebem `field.value` (do arquivo) inteiro, não `arquivo`/`colunas` separados, só pra manter a
// chamada curta o bastante no template (muito aninhado nesse ponto do formulário).
function colunasExportadas({ arquivo, colunas }) {
  return (obterInfoDoArquivo(arquivo)?.colunas || [])
    .filter((coluna) => colunaEstaNoArquivo(colunas, coluna.name));
}

function colunasNaoExportadas({ arquivo, colunas }) {
  return (obterInfoDoArquivo(arquivo)?.colunas || [])
    .filter((coluna) => !colunaEstaNoArquivo(colunas, coluna.name));
}

// Nem toda pessoa quer customizar todos os arquivos da fonte — em vez de pré-preencher todos,
// o formulário começa vazio e a própria pessoa escolhe (via "adicionar arquivo") quais quer.
function limparArquivos() {
  setFieldValue('config.arquivos', []);
  chaveDosArquivos.value += 1;
}

// Só os arquivos ainda não escolhidos em outra linha entram nas opções — evita duplicar o mesmo
// arquivo em duas linhas (o backend rejeita). A linha atual sempre pode manter o que já tem.
function arquivosDisponiveisPara(nomeAtual) {
  const jaEscolhidos = new Set(
    (values.config?.arquivos || []).map((arquivo) => arquivo.arquivo).filter(Boolean),
  );

  return Object.values(arquivosDaFontePorNome.value).filter(
    (arquivo) => arquivo.arquivo === nomeAtual || !jaEscolhidos.has(arquivo.arquivo),
  );
}

// Ao escolher o arquivo de uma linha, começa com todas as colunas selecionadas (conveniência —
// a pessoa desmarca o que não quiser) e sem ordenação.
function aoEscolherArquivo(idx, evento) {
  const arquivo = arquivosDaFontePorNome.value[evento.target.value];
  if (!arquivo) {
    setFieldValue(`config.arquivos[${idx}].colunas`, []);
    setFieldValue(`config.arquivos[${idx}].order_by`, []);
    return;
  }

  setFieldValue(`config.arquivos[${idx}].colunas`, arquivo.colunas.map((coluna) => ({
    coluna: coluna.name,
    label: coluna.label,
  })));
  setFieldValue(`config.arquivos[${idx}].order_by`, []);
}

// Só roda na criação — na edição a fonte fica desabilitada (não é editável depois de criado),
// então esse handler nunca dispara e não corre o risco de sobrescrever a `config` já carregada.
// `colunas` já vem pré-populado para todas as fontes do sistema via `buscarFontes` no `onMounted`.
function aoTrocarFonte(evento) {
  if (!evento.target.value) return;

  limparArquivos();
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    // `formValues` já sai pronto pro backend: os nomes compostos (`config.arquivos`,
    // `config.xlsx_tipado`) dispensam remontar `config`, e `nullableOuVazio()` no schema
    // (descricao, colunas.label) já troca `''` por `null` na validação. Linhas
    // de arquivo sem seleção nem chegam aqui — `arquivo` é `required()`, então `handleSubmit`
    // barra o envio antes de chamar este callback.
    const payload = { ...formValues };

    if (props.modelosDeRelatorioId) {
      delete payload.fonte;
    }

    const msg = props.modelosDeRelatorioId
      ? 'Modelo salvo com sucesso!'
      : 'Modelo criado com sucesso!';

    const resposta = await modelosDeRelatorioStore.salvarItem(payload, props.modelosDeRelatorioId);

    if (resposta) {
      alertStore.success(msg);
      modelosDeRelatorioStore.$reset();
      escaparDaRota(router);
    } else {
      alertStore.error('Não foi possível salvar o modelo. Tente novamente.');
    }
  } catch (error_) {
    alertStore.error(error_);
  }
});

onMounted(() => {
  modelosDeRelatorioStore.buscarFontes();

  if (props.modelosDeRelatorioId) {
    modelosDeRelatorioStore.buscarItem(props.modelosDeRelatorioId);
  }
});

watch(valoresIniciais, (novosValores) => {
  resetForm({ values: novosValores });
});
</script>

<template>
  <CabecalhoDePagina />

  <LoadingComponent v-if="chamadasPendentes.emFoco" />

  <form
    v-else
    class="flex column g2"
    @submit.prevent="onSubmit"
  >
    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="nome"
          :schema="schema"
        />
        <Field
          name="nome"
          type="text"
          class="inputtext light"
          maxlength="250"
        />
        <ErrorMessage
          name="nome"
          class="error-msg"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="fonte"
          :schema="schema"
        />
        <Field
          name="fonte"
          as="select"
          class="inputtext light"
          :disabled="!!props.modelosDeRelatorioId"
          @change="aoTrocarFonte"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="fonte in fontesDoSistema"
            :key="fonte.valor"
            :value="fonte.valor"
          >
            {{ fonte.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="fonte"
          class="error-msg"
        />
      </div>
    </div>

    <div class="f1">
      <SmaeLabel
        name="descricao"
        :schema="schema"
      />
      <SmaeText
        name="descricao"
        as="textarea"
        rows="3"
        class="inputtext light"
        :schema="schema"
      />
      <ErrorMessage
        name="descricao"
        class="error-msg"
      />
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1 flex g1 center">
        <SmaeLabel
          name="config.xlsx_tipado"
          :schema="schema"
        >
          <template #prepend>
            <Field
              id="xlsx_tipado"
              name="config.xlsx_tipado"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
              class="inputcheckbox"
            />
          </template>
        </SmaeLabel>
      </div>
    </div>

    <fieldset
      v-if="values.fonte"
    >
      <SmaeLabel
        as="legend"
        name="config.arquivos"
        :schema="schema"
      />

      <LoadingComponent v-if="chamadasPendentes.colunas" />

      <FieldArray
        v-else
        :key="chaveDosArquivos"
        v-slot="{
          fields,
          push: adicionarArquivo,
          remove: removerArquivo,
        }"
        name="config.arquivos"
      >
        <fieldset
          v-for="(field, idx) in fields"
          :key="`arquivo--${field.key}`"
          class="mb2 p1 pb0 vertical-numerada__item"
          :data-numeracao="idx + 1"
        >
          <legend>
            Arquivo
            <code v-if="field.value.arquivo">{{ field.value.arquivo }}</code>
          </legend>

          <div class="flex g2 mb1 start">
            <div class="f1">
              <Field
                :name="`config.arquivos[${idx}].arquivo`"
                as="select"
                class="inputtext light"
                @change="aoEscolherArquivo(idx, $event)"
              >
                <option value="">
                  Selecionar arquivo
                </option>
                <option
                  v-for="arquivo in arquivosDisponiveisPara(field.value.arquivo)"
                  :key="arquivo.arquivo"
                  :value="arquivo.arquivo"
                >
                  {{ arquivo.arquivo }}
                </option>
              </Field>
            </div>

            <button
              class="like-a__text mt1"
              type="button"
              aria-label="Remover"
              title="Remover"
              @click="removerArquivo(idx)"
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_remove" />
              </svg>
            </button>
          </div>

          <template v-if="field.value.arquivo">
            <p
              v-if="obterInfoDoArquivo(field.value.arquivo)?.descricao"
              class="tc600"
            >
              {{ obterInfoDoArquivo(field.value.arquivo)?.descricao }}
            </p>

            <div class="flex g1 start mb2">
              <SmaeLabel
                name="config.arquivos.incluir"
                :schema="schema"
              >
                <template #prepend>
                  <Field
                    :name="`config.arquivos[${idx}].incluir`"
                    type="checkbox"
                    :value="false"
                    :unchecked-value="true"
                    class="inputcheckbox"
                  />
                </template>
              </SmaeLabel>
            </div>
          </template>

          <template v-if="field.value.arquivo && field.value.incluir">
            <fieldset class="mb2">
              <SmaeLabel
                as="legend"
                name="config.arquivos.colunas"
                :schema="schema"
              />

              <FieldArray
                v-slot="{
                  fields: camposDeColuna,
                  push: adicionarColuna,
                  remove: removerColuna,
                  move: moverColuna,
                }"
                :name="`config.arquivos[${idx}].colunas`"
              >
                <ListaReordenavel
                  :items="camposDeColuna"
                  @move="moverColuna"
                >
                  <template #default="{ item: campoDeColuna, index: colIdx }">
                    <div class="flex g2">
                      <div class="f1">
                        <SmaeLabel
                          name="config.arquivos.colunas.coluna"
                          :schema="schema"
                        />
                        <Field
                          :name="`config.arquivos[${idx}].colunas[${colIdx}].coluna`"
                          as="select"
                          class="inputtext light"
                          :disabled="colunaEhTravada(
                            field.value.arquivo, campoDeColuna.value?.coluna
                          )"
                        >
                          <option value="">
                            Selecionar coluna
                          </option>
                          <option
                            v-for="coluna in obterInfoDoArquivo(field.value.arquivo)?.colunas"
                            :key="coluna.name"
                            :value="coluna.name"
                          >
                            {{ coluna.label }}
                          </option>
                        </Field>
                      </div>

                      <div class="f1">
                        <SmaeLabel
                          name="config.arquivos.colunas.label"
                          :schema="schema"
                        />
                        <Field
                          :name="`config.arquivos[${idx}].colunas[${colIdx}].label`"
                          type="text"
                          placeholder="Título (opcional)"
                          class="inputtext light"
                          :disabled="colunaEhTravada(
                            field.value.arquivo, campoDeColuna.value?.coluna
                          )"
                        />
                      </div>
                    </div>
                  </template>

                  <template #extra="{ item: campoDeColuna, index: colIdx }">
                    <button
                      class="like-a__text mt2"
                      type="button"
                      aria-label="Remover"
                      title="Remover"
                      :disabled="colunaEhTravada(field.value.arquivo, campoDeColuna.value?.coluna)"
                      @click="removerColuna(colIdx)"
                    >
                      <svg
                        width="20"
                        height="20"
                      >
                        <use xlink:href="#i_remove" />
                      </svg>
                    </button>
                  </template>
                </ListaReordenavel>

                <button
                  class="like-a__text addlink"
                  type="button"
                  @click="adicionarColuna({ coluna: '', label: '' })"
                >
                  <svg
                    width="20"
                    height="20"
                  >
                    <use xlink:href="#i_+" />
                  </svg>
                  <span>adicionar coluna</span>
                </button>
              </FieldArray>
            </fieldset>

            <fieldset>
              <SmaeLabel
                as="legend"
                name="config.arquivos.order_by"
                :schema="schema"
              />

              <FieldArray
                v-slot="{
                  fields: camposDeOrdenacao,
                  push: adicionarOrdenacao,
                  remove: removerOrdenacao,
                  move: moverOrdenacao,
                }"
                :name="`config.arquivos[${idx}].order_by`"
              >
                <ListaReordenavel
                  :items="camposDeOrdenacao"
                  @move="moverOrdenacao"
                >
                  <template #default="{ item: campoDeOrdenacao, index: ordemIdx }">
                    <div class="flex g2">
                      <div class="f1">
                        <SmaeLabel
                          name="config.arquivos.order_by.coluna"
                          :schema="schema"
                        />
                        <Field
                          :name="`config.arquivos[${idx}].order_by[${ordemIdx}].coluna`"
                          as="select"
                          class="inputtext light"
                        >
                          <option value="">
                            Selecionar coluna
                          </option>
                          <option
                            v-for="coluna in colunasExportadas(field.value)"
                            :key="coluna.name"
                            :value="coluna.name"
                          >
                            {{ coluna.label }}
                          </option>
                          <optgroup
                            v-if="colunasNaoExportadas(field.value).length"
                            label="Colunas não selecionadas para o arquivo"
                          >
                            <option
                              v-for="coluna in colunasNaoExportadas(field.value)"
                              :key="coluna.name"
                              :value="coluna.name"
                            >
                              {{ coluna.label }}
                            </option>
                          </optgroup>
                        </Field>

                        <p
                          v-if="campoDeOrdenacao.value?.coluna
                            && !colunaEstaNoArquivo(
                              field.value.colunas, campoDeOrdenacao.value.coluna
                            )"
                          class="flex g1 center tc600 p05"
                        >
                          <svg
                            width="24"
                            height="24"
                            color="#F2890D"
                          ><use xlink:href="#i_alert" /></svg>
                          A coluna escolhida não está entre as selecionadas para o arquivo.
                        </p>
                      </div>

                      <div class="f1">
                        <SmaeLabel
                          name="config.arquivos.order_by.direcao"
                          :schema="schema"
                        />
                        <Field
                          :name="`config.arquivos[${idx}].order_by[${ordemIdx}].direcao`"
                          as="select"
                          class="inputtext light"
                        >
                          <option value="ASC">
                            Crescente
                          </option>
                          <option value="DESC">
                            Decrescente
                          </option>
                        </Field>
                      </div>
                    </div>
                  </template>

                  <template #extra="{ index: ordemIdx }">
                    <button
                      class="like-a__text mt2"
                      type="button"
                      aria-label="Remover"
                      title="Remover"
                      @click="removerOrdenacao(ordemIdx)"
                    >
                      <svg
                        width="20"
                        height="20"
                      >
                        <use xlink:href="#i_remove" />
                      </svg>
                    </button>
                  </template>
                </ListaReordenavel>

                <button
                  class="like-a__text addlink"
                  type="button"
                  @click="adicionarOrdenacao({ coluna: '', direcao: 'ASC' })"
                >
                  <svg
                    width="20"
                    height="20"
                  >
                    <use xlink:href="#i_+" />
                  </svg>
                  <span>adicionar critério de ordenação</span>
                </button>
              </FieldArray>
            </fieldset>
          </template>
        </fieldset>

        <button
          class="like-a__text addlink"
          type="button"
          :disabled="values.config?.arquivos?.length >= Object.keys(arquivosDaFontePorNome)?.length"
          @click="adicionarArquivo({
            arquivo: '', colunas: [], incluir: true, order_by: [],
          })"
        >
          <svg
            width="20"
            height="20"
          >
            <use xlink:href="#i_+" />
          </svg>
          <span>personalizar arquivo</span>
        </button>
      </FieldArray>
    </fieldset>

    <FormErrorsList :errors="errors" />

    <SmaeFieldsetSubmit :disabled="isSubmitting" />
  </form>
</template>
