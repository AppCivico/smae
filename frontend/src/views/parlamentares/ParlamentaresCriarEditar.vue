<script setup>
import InputImageProfile from '@/components/InputImageProfile.vue';
import ParlamentaresExibirRepresentatividade from '@/components/parlamentares/ParlamentaresExibirRepresentatividade.vue';
import { parlamentar as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { vMaska } from 'maska';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form,
} from 'vee-validate';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const router = useRouter();
const route = useRoute();
const props = defineProps({
  parlamentarId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const authStore = useAuthStore();
const parlamentaresStore = useParlamentaresStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(parlamentaresStore);
const avatar = ref(null);

async function onSubmit(values) {
  const newValues = nulificadorTotal(values);
  newValues.upload_foto = avatar.value ? avatar.value : itemParaEdicao.value.foto;
  try {
    let r;
    const msg = props.parlamentarId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.parlamentarId) {
      r = await parlamentaresStore.salvarItem(newValues, props.parlamentarId);
    } else {
      r = await parlamentaresStore.salvarItem(newValues);
    }
    if (r) {
      alertStore.success(msg);
      parlamentaresStore.$reset();
      router.push({ name: 'parlamentaresListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function iniciar() {
  parlamentaresStore.$reset();

  if (props.parlamentarId) {
    parlamentaresStore.buscarItem(props.parlamentarId);
  }
}

function excluirItem(tipo, id, nome) {
  useAlertStore().confirmAction(`Deseja mesmo remover ${nome || 'esse item'}?`, async () => {
    let tentativa;
    let mensagem;

    switch (tipo) {
      case 'assessor':
      case 'contato':
      case 'pessoa':
        tentativa = await useParlamentaresStore().excluirPessoa(id);
        mensagem = 'Remoção bem sucedida';
        break;

      case 'mandato':
        tentativa = await useParlamentaresStore().excluirMandato(id);
        mensagem = 'Mandato removido.';
        break;

      default:
        useAlertStore().error('Tipo fornecido para remoção inválido');
        throw new Error('Tipo fornecido para remoção inválido');
    }

    if (tentativa) {
      useAlertStore().success(mensagem);
      iniciar();
    }
  }, 'Remover');
}

const equipe = computed(() => itemParaEdicao.value?.equipe?.reduce((acc, cur) => {
  if (cur.tipo === 'Assessor') {
    acc.assessores.push(cur);
  } else if (cur.tipo === 'Contato') {
    acc.contatos.push(cur);
  }
  return acc;
}, { assessores: [], contatos: [] }) || { assessores: [], contatos: [] });

const equipeOrdenada = computed(() => {
  const equipeCompleta = equipe.value.assessores.concat(equipe.value.contatos);
  return equipeCompleta.sort((a, b) => a.nome.localeCompare(b.nome));
});

const imageUrl = computed(() => (itemParaEdicao.value && itemParaEdicao.value.foto ? `${baseUrl}/download/${itemParaEdicao.value.foto}?inline=true` : false));

async function handleImage(e) {
  const formData = new FormData();
  formData.append('tipo', 'FOTO_PARLAMENTAR');
  formData.append('arquivo', e);
  const response = await requestS.upload(`${baseUrl}/upload`, formData);
  if (response.upload_token) {
    avatar.value = response.upload_token;
  }
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Parlamentar' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting, setFieldValue }"
    :validation-schema="schema"
    :initial-values="itemParaEdicao"
    @submit="onSubmit"
  >
    <div class="parlamentar-container mb3">
      <div>
        <div class="flex g2 mb1">
          <div class="f1">
            <LabelFromYup
              name="nome"
              :schema="schema"
            />
            <Field
              name="nome"
              type="text"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="nome"
            />
          </div>
        </div>

        <div class="flex g2 mb1">
          <div class="f1">
            <LabelFromYup
              name="nome_popular"
              :schema="schema"
            />
            <Field
              name="nome_popular"
              type="text"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="nome_popular"
            />
          </div>
        </div>
        <div>
          <LabelFromYup
            name="cpf"
            :schema="schema"
          />
          <Field
            v-maska
            name="cpf"
            type="text"
            class="inputtext light mb1"
            minlength="14"
            maxlength="14"
            data-maska="###.###.###-##"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="cpf"
          />
        </div>

        <div class="f1 small-input">
          <LabelFromYup
            name="nascimento"
            :schema="schema"
          />
          <Field
            name="nascimento"
            type="date"
            class="inputtext light mb1"
            maxlength="10"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('nascimento', $v || null); }"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="nascimento"
          />
        </div>

        <div
          v-if="authStore.temPermissãoPara('SMAE.acesso_telefone')"
          class="flex f1 mb1 small-input"
        >
          <div class="f1 tipinfo">
            <LabelFromYup
              name="telefone"
              :schema="schema"
            />
            <div>LGPD - Evite cadastrar dados pessoais</div>
            <Field
              v-maska
              name="telefone"
              type="text"
              class="inputtext light mb1"
              maxlength="15"
              data-maska="(##) #####-####'"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="telefone"
            />
          </div>
        </div>

        <label class="block mt2 mb2">
          <Field
            name="em_atividade"
            type="checkbox"
            :value="true"
            :unchecked-value="false"
            class="inputcheckbox"
          />
          <LabelFromYup
            name="em_atividade"
            :schema="schema"
            as="span"
          />
        </label>
      </div>
      <Field
        v-slot="{ value }"
        name="avatar"
      >
        <InputImageProfile
          :model-value="imageUrl"
          @update:model-value="event => handleImage(event)"
        />
      </Field>
    </div>

    <div
      v-if="props.parlamentarId"
      class="mb3"
    >
      <div class="flex spacebetween center mb1">
        <span class="label tc300">Assessores / Contatos</span>
        <hr class="mr2 f1">
      </div>

      <table
        v-if="equipe.assessores.length || equipe.contatos.length"
        class="tablemain mb1"
      >
        <colgroup>
          <col>
          <col>
          <col class="col--botão-de-ação">
          <col class="col--botão-de-ação">
        </colgroup>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in equipeOrdenada"
            :key="item.id"
          >
            <td>{{ item.nome }}</td>
            <td>{{ item.tipo }}</td>
            <td>
              <router-link
                :to="{
                  name: 'parlamentaresEditarEquipe',
                  params: { parlamentarId: props.parlamentarId, pessoaId: item.id }
                }"
                class="tprimary"
                aria-label="Editar {{ item.tipo }}"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>
            </td>
            <td>
              <button
                class="like-a__text"
                arial-label="excluir"
                title="excluir"
                type="button"
                @click="excluirItem(item.tipo === 'Assessor' ? 'assessor' : 'contato', item.id, item.nome)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>
        Nenhum assessor ou contato encontrado
      </p>

      <router-link
        :to="{
          name: 'parlamentaresEditarEquipe',
          params: {
            parlamentarId:
              props.parlamentarId
          },
          query: { tipo: 'assessor' }
        }"
        class="like-a__text addlink"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg>Registrar novo assessor/contato
      </router-link>
    </div>

    <FormErrorsList :errors="errors" />

    <div v-if="itemParaEdicao?.mandatos">
      <div class="flex spacebetween center mb1">
        <span class="label tc300">Mandato</span>
        <hr class="mr2 f1">
      </div>

      <table class="tablemain mb1">
        <colgroup>
          <col>
          <col>
          <col>
          <col class="col--botão-de-ação">
          <col class="col--botão-de-ação">
        </colgroup>
        <thead>
          <tr>
            <th>
              Eleição
            </th>
            <th>
              Cargo
            </th>
            <th>
              Votos
            </th>
            <th />
            <th />
          </tr>
        </thead>
        <tbody v-if="itemParaEdicao?.mandatos?.length > 0">
          <tr
            v-for="item in itemParaEdicao.mandatos"
            :key="item.id"
          >
            <td>{{ item.eleicao.ano }}</td>
            <td>{{ item.cargo }}</td>
            <td>{{ item.votos_estado }}</td>

            <td>
              <router-link
                :to="{ name: 'parlamentaresEditarMandato', params: { parlamentarId: props.parlamentarId, mandatoId: item.id } }"
                class="tprimary"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>
            </td>
            <td>
              <button
                class="like-a__text"
                arial-label="excluir"
                title="excluir"
                type="button"
                @click="excluirItem('mandato', item.id)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="5">
              Nenhum mandato encontrado.
            </td>
          </tr>
        </tbody>
      </table>
      <router-link
        :to="{ name: 'parlamentaresEditarMandato', params: { parlamentarId: props.parlamentarId } }"
        class="like-a__text addlink mb4"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg>Registrar novo mandato
      </router-link>
    </div>

    <ParlamentaresExibirRepresentatividade
      v-if="props.parlamentarId"
      :exibir-edição="true"
    />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>

  <router-view />
</template>

<style scoped lang="less">
.parlamentar-container {
  max-width: 900px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 15px;

  & > :nth-child(2) {
    justify-self: end;
  }
}

.tipinfo > div {
  max-width: 100%;
  left: 200px;
}

.small-input{
  max-width: 300px;
}

table{
  max-width: 1000px;
}
</style>
