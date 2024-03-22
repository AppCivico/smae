<script setup>
import { emailTransferencia as schema } from "@/consts/formSchemas";

import { useTransferenciasVoluntariasStore } from "@/stores/transferenciasVoluntarias.store.js";
import { storeToRefs } from "pinia";
import { Field, useForm, useIsFormDirty } from "vee-validate";
import { computed, reactive, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const route = useRoute();
const router = useRouter();
const transferenciasStore = useTransferenciasVoluntariasStore();
// const alertStore = useAlertStore();

const newEmail = ref("");
const localEmails = ref([
  "joao@hotmail.com",
  "maria@gmail.com",
  "carlos@yahoo.com",
]);

const periodicidades = ["Semanal", "Quinzenal", "Mensal"];

function removeEmail(index, event) {
  console.log("entrou no removeEmail");
  event.preventDefault();
  localEmails.value.splice(index, 1);
  console.log("localEmails: ", localEmails.value);
}

function addNewEmail() {
  const emails = newEmail.value
    .split(/[;, ]+/)
    .filter((email) => email.trim() !== "");
  emails.forEach((email) => {
    if (email !== "" && !localEmails.value.includes(email)) {
      localEmails.value.push(email);
    }
  });
  newEmail.value = "";
}

async function onSubmit() {
  console.log("fez submit");
}
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ $route.meta.título || "Disparo de e-mail" }}</h2>
    <hr class="ml2 f1" />

    <CheckClose :formulário-sujo="formulárioSujo" />
  </div>

  <div class="mb4 disparo-email">
    <div class="">
      <Form :validation-schema="schema" @submit="onSubmit">
        <div class="mb2 flex flexwrap g2">
          <div class="f1">
            <LabelFromYup name="ativo" :schema="schema" />
            <Field
              name="ativo"
              type="checkbox"
              value="true"
              class="inputcheckbox"
            />
          </div>
          <div class="f1">
            <LabelFromYup name="recorrencia_dias" :schema="schema" />
            <Field
              name="atirecorrencia_diasvo"
              type="number"
              class="inputtext light mb1"
            />
          </div>
        </div>

        <div class="flex mb2 flexwrap g2">
          <div class="f1">
            <LabelFromYup name="numero_periodo" :schema="schema" />
            <Field
              name="numero_periodo"
              as="select"
              class="inputtext light mb1"
            >
              <option
                v-for="periodicidade in periodicidades"
                :key="periodicidade"
                :value="periodicidade"
              >
                {{ periodicidade }}
              </option>
            </Field>
          </div>
          <div class="f1">
            <LabelFromYup name="numero" :schema="schema" />
            <Field
              name="numero"
              type="number"
              class="inputtext light mb1"
              maxlength="10"
            />
          </div>
        </div>
        <div></div>
        <div class="mb2">
          <div class="f1">
            <LabelFromYup name="com_copia" :schema="schema" />
            <Field
              v-model="newEmail"
              name="com_copia"
              type="email"
              class="inputtext light mb1"
              maxlength="250"
              placeholder="email@dominio.com"
              @blur="addNewEmail()"
            />
            <ul v-if="localEmails" class="flex flexwrap">
              <li v-for="(email, index) in localEmails" :key="index">
                <button
                  type="button"
                  class="tagsmall"
                  tabindex="1"
                  @click="removeEmail(index, $event)"
                >
                  {{ email }}
                  <svg width="12" height="12"><use xlink:href="#i_x" /></svg>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div class="flex spacebetween center">
          <hr class="mr2 f1" />
          <button class="btn big">Salvar</button>
          <hr class="ml2 f1" />
        </div>
      </Form>
    </div>
  </div>
</template>
