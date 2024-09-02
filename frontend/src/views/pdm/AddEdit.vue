<script setup>
import { Dashboard } from '@/components';
import requestS from '@/helpers/requestS.ts';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import * as Yup from 'yup';

import {
  useAlertStore,
  useAuthStore,
  useEditModalStore,
  usePdMStore,
} from '@/stores';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();

const alertStore = useAlertStore();
const route = useRoute();
const { pdm_id } = route.params;

const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);
PdMStore.clear();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;
let title = 'Cadastro de PdM';
const possui_iniciativa = ref(singlePdm.value.possui_iniciativa);
if (pdm_id) {
  title = 'Editar PdM';
  (async () => {
    await PdMStore.getById(pdm_id);
    curfile.name = singlePdm.value.logo;
    possui_iniciativa.value = singlePdm.value.possui_iniciativa;
  })();
}

const regx = /^$|^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

const schema = Yup.object().shape({
  nome: Yup.string().required('Preencha o nome'),
  descricao: Yup.string().required('Preencha a descrição'),

  data_inicio: Yup.string().required('Preencha a data').matches(regx, 'Formato inválido'),
  data_fim: Yup.string().required('Preencha a data').matches(regx, 'Formato inválido'),
  data_publicacao: Yup.string().notRequired().matches(regx, 'Formato inválido'),

  periodo_do_ciclo_participativo_inicio: Yup.string().notRequired().matches(regx, 'Formato inválido'),
  periodo_do_ciclo_participativo_fim: Yup.string().notRequired().matches(regx, 'Formato inválido'),
  prefeito: Yup.string().required('Preencha o prefeito'),

  equipe_tecnica: Yup.string().nullable(),
  ativo: Yup.boolean().nullable(),

  possui_macro_tema: Yup.boolean().nullable(),
  rotulo_macro_tema: Yup.string().nullable().when('possui_macro_tema', (v, f) => (v == '1' ? f.required('Escreva um título') : f)),
  possui_tema: Yup.boolean().nullable(),
  rotulo_tema: Yup.string().nullable().when('possui_tema', (v, f) => (v == '1' ? f.required('Escreva um título') : f)),
  possui_sub_tema: Yup.boolean().nullable(),
  rotulo_sub_tema: Yup.string().nullable().when('possui_sub_tema', (v, f) => (v == '1' ? f.required('Escreva um título') : f)),
  possui_contexto_meta: Yup.boolean().nullable(),
  rotulo_contexto_meta: Yup.string().nullable().when('possui_contexto_meta', (v, f) => (v == '1' ? f.required('Escreva um título') : f)),
  possui_complementacao_meta: Yup.boolean().nullable(),
  rotulo_complementacao_meta: Yup.string().nullable().when('possui_complementacao_meta', (v, f) => (v == '1' ? f.required('Escreva um título') : f)),

  possui_iniciativa: Yup.boolean().nullable().when('possui_atividade', (v, f) => (v == '1' ? f.required('Para habilitar atividade é necessário habilitar iniciativa') : f)),
  rotulo_iniciativa: Yup.string().nullable().when('possui_iniciativa', (v, f) => (v == '1' ? f.required('Escreva um título') : f)),
  possui_atividade: Yup.boolean().nullable(),
  rotulo_atividade: Yup.string().nullable().when('possui_atividade', (v, f) => (v == '1' ? f.required('Escreva um título') : f)),

  upload_logo: Yup.string().nullable(),

  nivel_orcamento: Yup.string().nullable(),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;

    if (pdm_id && singlePdm.value.id) {
      r = await PdMStore.update(singlePdm.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await PdMStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      PdMStore.clear();
      await router.push({ name: 'gerenciarPdm' });
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    editModalStore.$reset();
    alertStore.$reset();
    router.push({ name: 'gerenciarPdm' });
  });
}
function maskDate(el) {
  const kC = event.keyCode;
  let data = el.target.value.replace(/[^0-9/]/g, '');
  if (kC != 8 && kC != 46) {
    if (data.length == 2) {
      el.target.value = data += '/';
    } else if (data.length == 5) {
      el.target.value = data += '/';
    } else {
      el.target.value = data;
    }
  }
}

const curfile = reactive({});
function removeshape() {
  curfile.name = '';
  curfile.loading = null;
  singlePdm.value.upload_logo = curfile.name;
}
async function uploadshape(e) {
  curfile.name = '';
  curfile.loading = true;

  const { files } = e.target;
  const formData = new FormData();
  formData.append('tipo', 'LOGO_PDM');
  formData.append('arquivo', files[0]);

  const u = await requestS.upload(`${baseUrl}/upload`, formData);
  if (u.upload_token) {
    curfile.name = u.upload_token;
    curfile.loading = null;
    singlePdm.value.upload_logo = curfile.name;
  }
}
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>{{ title }}</h1>
      <hr class="ml2 f1">
      <button
        class="btn round ml2"
        @click="checkClose"
      >
        <svg
          width="12"
          height="12"
        ><use xlink:href="#i_x" /></svg>
      </button>
    </div>
    <template v-if="!(singlePdm?.loading || singlePdm?.error)">
      <Form
        v-slot="{ errors, isSubmitting, values }"
        :validation-schema="schema"
        :initial-values="singlePdm"
        @submit="onSubmit"
      >
        <div
          v-if="pdm_id && perm?.CadastroPdm?.inativar"
          class="flex g2 mb2"
        >
          <div class="f1">
            <label class="block mb1">
              <Field
                name="ativo"
                type="checkbox"
                value="1"
                :checked="ativo"
                class="mr1"
              />
              <template v-if="values.ativo">Programa ativo</template>
              <template v-else>Programa inativo</template>
            </label>
            <p class="t13 tc500">
              Ao ativar um Programa de Metas, todos os demais programas serão inativados
            </p>
          </div>
        </div>
        <div class="flex g2">
          <div class="f1">
            <label class="label">Nome <span class="tvermelho">*</span></label>
            <Field
              name="nome"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.nome }"
            />
            <div class="error-msg">
              {{ errors.nome }}
            </div>
          </div>
        </div>
        <div class="flex g2">
          <div class="f1">
            <label class="label">Descrição <span class="tvermelho">*</span></label>
            <Field
              name="descricao"
              as="textarea"
              rows="3"
              class="inputtext light mb1"
              :class="{ 'error': errors.descricao }"
            />
            <div class="error-msg">
              {{ errors.descricao }}
            </div>
          </div>
        </div>

        <div class="mt2">
          <label class="label tc300">Logo do Programa de Metas</label>

          <label
            v-if="!curfile.loading && !curfile.name"
            class="addlink"
          ><svg
             width="20"
             height="20"
           ><use xlink:href="#i_+" /></svg>
            <span>
              Adicionar arquivo (formatos SVG ou PNG até 2mb)&nbsp;<span class="tvermelho">*</span>
            </span>
            <input
              type="file"
              accept=".svg,.png"
              :onchange="uploadshape"
              style="display:none;"
            ></label>

          <div
            v-else-if="curfile.loading"
            class="addlink"
          >
            <span>Carregando</span> <svg
              width="20"
              height="20"
            ><use xlink:href="#i_spin" /></svg>
          </div>

          <div v-else-if="curfile.name">
            <img
              v-if="singlePdm.logo == curfile?.name"
              :src="`${baseUrl}/download/${singlePdm.logo}?inline=true`"
              width="100"
              class="ib mr1"
            >
            <span v-else>{{ curfile?.name?.slice(0, 30) }}</span>
            <a
              :onclick="removeshape"
              class="addlink"
            ><svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg></a>
          </div>
          <Field
            name="upload_logo"
            type="hidden"
            :value="curfile?.name"
          />
        </div>

        <hr class="mt2 mb2">

        <div class="flex g2">
          <div class="f1">
            <label class="label">Início do Período <span class="tvermelho">*</span></label>
            <Field
              name="data_inicio"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.data_inicio }"
              maxlength="10"
              placeholder="dd/mm/aaaa"
              @keyup="maskDate"
            />
            <div class="error-msg">
              {{ errors.data_inicio }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Fim do Período <span class="tvermelho">*</span></label>
            <Field
              name="data_fim"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.data_fim }"
              maxlength="10"
              placeholder="dd/mm/aaaa"
              @keyup="maskDate"
            />
            <div class="error-msg">
              {{ errors.data_fim }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Data de Publicação</label>
            <Field
              name="data_publicacao"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.data_publicacao }"
              maxlength="10"
              placeholder="dd/mm/aaaa"
              @keyup="maskDate"
            />
            <div class="error-msg">
              {{ errors.data_publicacao }}
            </div>
          </div>
        </div>
        <div class="flex g2">
          <div class="f1">
            <label class="label">Inicio do ciclo participativo</label>
            <Field
              name="periodo_do_ciclo_participativo_inicio"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.periodo_do_ciclo_participativo_inicio }"
              maxlength="10"
              placeholder="dd/mm/aaaa"
              @keyup="maskDate"
            />
            <div class="error-msg">
              {{ errors.periodo_do_ciclo_participativo_inicio }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Fim do ciclo participativo</label>
            <Field
              name="periodo_do_ciclo_participativo_fim"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.periodo_do_ciclo_participativo_fim }"
              maxlength="10"
              placeholder="dd/mm/aaaa"
              @keyup="maskDate"
            />
            <div class="error-msg">
              {{ errors.periodo_do_ciclo_participativo_fim }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Prefeito <span class="tvermelho">*</span></label>
            <Field
              name="prefeito"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.prefeito }"
            />
            <div class="error-msg">
              {{ errors.prefeito }}
            </div>
          </div>
        </div>
        <div class="flex g2">
          <div class="f1">
            <label class="label">Equipe técnica</label>
            <Field
              name="equipe_tecnica"
              as="textarea"
              rows="3"
              class="inputtext light mb1"
              :class="{ 'error': errors.equipe_tecnica }"
            />
            <div class="error-msg">
              {{ errors.equipe_tecnica }}
            </div>
            <p class="t13 tc500">
              Separe os membros por vírgula ou ponto-e-vírgula
            </p>
          </div>
        </div>

        <hr class="mt2 mb2">

        <div class="flex center g2">
          <div class="f1">
            <label class="label">Rótulo do Macrotema</label>
            <Field
              name="rotulo_macro_tema"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.rotulo_macro_tema }"
            />
            <div class="error-msg">
              {{ errors.rotulo_macro_tema }}
            </div>
          </div>
          <div
            class="f0"
            style="flex-basis: 200px;"
          >
            <label class="block mb1">
              <Field
                name="possui_macro_tema"
                class="inputcheckbox"
                :class="{ 'error': errors.possui_macro_tema }"
                type="checkbox"
                value="1"
                :checked="possui_macro_tema"
              /><span>Habilitar Macrotema</span>
            </label>
          </div>
        </div>
        <div class="flex center g2">
          <div class="f1">
            <label class="label">Rótulo do Tema</label>
            <Field
              name="rotulo_tema"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.rotulo_tema }"
            />
            <div class="error-msg">
              {{ errors.rotulo_tema }}
            </div>
          </div>
          <div
            class="f0"
            style="flex-basis: 200px;"
          >
            <label class="block mb1">
              <Field
                name="possui_tema"
                class="inputcheckbox"
                :class="{ 'error': errors.possui_tema }"
                type="checkbox"
                value="1"
                :checked="possui_tema"
              /><span>Habilitar Tema</span>
            </label>
          </div>
        </div>
        <div class="flex center g2">
          <div class="f1">
            <label class="label">Rótulo do Subtema</label>
            <Field
              name="rotulo_sub_tema"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.rotulo_sub_tema }"
            />
            <div class="error-msg">
              {{ errors.rotulo_sub_tema }}
            </div>
          </div>
          <div
            class="f0"
            style="flex-basis: 200px;"
          >
            <label class="block mb1">
              <Field
                name="possui_sub_tema"
                class="inputcheckbox"
                :class="{ 'error': errors.possui_sub_tema }"
                type="checkbox"
                value="1"
                :checked="possui_sub_tema"
              /><span>Habilitar Subtema</span>
            </label>
          </div>
        </div>
        <div class="flex center g2">
          <div class="f1">
            <label class="label">Rótulo do Contexto da Meta</label>
            <Field
              name="rotulo_contexto_meta"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.rotulo_contexto_meta }"
            />
            <div class="error-msg">
              {{ errors.rotulo_contexto_meta }}
            </div>
          </div>
          <div
            class="f0"
            style="flex-basis: 200px;"
          >
            <label class="block mb1">
              <Field
                name="possui_contexto_meta"
                class="inputcheckbox"
                :class="{ 'error': errors.possui_contexto_meta }"
                type="checkbox"
                value="1"
                :checked="possui_contexto_meta"
              /><span>Habilitar Contexto</span>
            </label>
          </div>
        </div>
        <div class="flex center g2">
          <div class="f1">
            <label class="label">Rótulo do Complementação da Meta</label>
            <Field
              name="rotulo_complementacao_meta"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.rotulo_complementacao_meta }"
            />
            <div class="error-msg">
              {{ errors.rotulo_complementacao_meta }}
            </div>
          </div>
          <div
            class="f0"
            style="flex-basis: 200px;"
          >
            <label class="block mb1">
              <Field
                name="possui_complementacao_meta"
                class="inputcheckbox"
                :class="{ 'error': errors.possui_complementacao_meta }"
                type="checkbox"
                value="1"
                :checked="possui_complementacao_meta"
              /><span>Habilitar Complementação</span>
            </label>
          </div>
        </div>

        <hr class="mt2 mb2">
        <div class="flex center g2">
          <div class="f1">
            <label class="label">Rótulo da Iniciativa</label>
            <Field
              name="rotulo_iniciativa"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.rotulo_iniciativa }"
            />
            <div class="error-msg">
              {{ errors.rotulo_iniciativa }}
            </div>
            <div class="error-msg">
              {{ errors.possui_iniciativa }}
            </div>
          </div>
          <div
            class="f0"
            style="flex-basis: 200px;"
          >
            <label class="block mb1">
              <Field
                v-model="possui_iniciativa"
                name="possui_iniciativa"
                class="inputcheckbox"
                :class="{ 'error': errors.possui_iniciativa }"
                type="checkbox"
                value="1"
              />
              <span>Habilitar Iniciativa</span>
            </label>
          </div>
        </div>
        <div class="flex center g2">
          <div class="f1">
            <label class="label">Rótulo da Atividade</label>
            <Field
              name="rotulo_atividade"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.rotulo_atividade }"
              :disabled="!possui_iniciativa"
            />
            <div class="error-msg">
              {{ errors.rotulo_atividade }}
            </div>
          </div>
          <div
            class="f0"
            style="flex-basis: 200px;"
          >
            <label class="block mb1">
              <Field
                name="possui_atividade"
                class="inputcheckbox"
                :class="{ 'error': errors.possui_atividade }"
                type="checkbox"
                value="1"
                :disabled="!possui_iniciativa"
              /><span>Habilitar Atividade</span>
            </label>
          </div>
        </div>
        <div class="error-msg">
          {{ errors.possui_atividade }}
        </div>
        <hr class="mt2 mb2">

        <div class="flex center g2">
          <div class="f1">
            <label class="label">Nível de controle orçamentário</label>
            <Field
              name="nivel_orcamento"
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors.nivel_orcamento }"
            >
              <option value="Meta">
                Meta
              </option>
              <option value="Iniciativa">
                Iniciativa
              </option>
              <option value="Atividade">
                Atividade
              </option>
            </Field>
            <div class="error-msg">
              {{ errors.nivel_orcamento }}
            </div>
          </div>
        </div>

        <div class="flex spacebetween center mb2">
          <hr class="mr2 f1">
          <button
            class="btn big"
            :disabled="isSubmitting"
          >
            Salvar
          </button>
          <hr class="ml2 f1">
        </div>
      </Form>
    </template>

    <template v-if="singlePdm?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="singlePdm?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ singlePdm.error ?? error }}
        </div>
      </div>
    </template>
  </Dashboard>
</template>
