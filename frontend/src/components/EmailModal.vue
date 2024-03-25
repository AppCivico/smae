<script setup>
import { emailTransferencia as schema } from "@/consts/formSchemas";
import { storeToRefs } from "pinia";
import { Field, Form } from "vee-validate";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAlertStore } from "@/stores/alert.store";
import { useEmailsStore } from "@/stores/envioEmail.store";

const alertStore = useAlertStore();
const route = useRoute();
const router = useRouter();
const emailsStore = useEmailsStore();
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(emailsStore);

const props = defineProps({
  disparoEmailId: {
    type: Number,
    default: 0,
  },
});

const newEmail = ref("");
const localEmails = ref([
  "joao@hotmail.com",
  "maria@gmail.com",
  "carlos@yahoo.com",
]);

const periodicidades = ["Dias", "Semanas", "Meses", "Anos"];

function removeEmail(index, event) {
  event.preventDefault();
  localEmails.value.splice(index, 1);
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

async function onSubmit(values) {
  try {
    let resposta;
    const msg = props.disparoEmailId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";
    const valoresAuxiliares = {
      ...values,
      ativo: values.ativo === undefined ? false : value.ativo,
      numero: parseInt(values.numero),
      recorrencia_dias: parseInt(values.recorrencia_dias),
      com_copia: localEmails.value.slice(),
      tipo: "CronogramaTerminoPlanejado",
      tarefa_cronograma_id: parseInt(route.params.transferenciaId),
    };
    resposta = await emailsStore.salvarItem(valoresAuxiliares);
    if (resposta) {
      alertStore.success(msg);
      emailsStore.$reset();
      router.push({ name: "TransferenciaCronograma" });
    }
  } catch (error) {
    alertStore.error(error);
  }
}
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ $route.meta.título || "Disparo de e-mail" }}</h2>
    <hr class="ml2 f1" />
    <CheckClose />
  </div>
  <div class="mb4">
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="itemParaEdição"
      @submit="onSubmit"
    >
      <div class="mb2 flex flexwrap g2">
        <div class="f1">
          <LabelFromYup name="ativo" :schema="schema" />
          <Field
            name="ativo"
            type="checkbox"
            :value="true"
            class="inputcheckbox"
          />
        </div>
        <div class="f1">
          <LabelFromYup name="recorrencia_dias" :schema="schema" />
          <Field
            name="recorrencia_dias"
            type="number"
            min="0"
            class="inputtext light mb1"
          />
        </div>
      </div>

      <div class="flex mb2 flexwrap g2">
        <div class="f1">
          <LabelFromYup name="numero_periodo" :schema="schema" />
          <Field name="numero_periodo" as="select" class="inputtext light mb1">
            <option value>Selecionar</option>
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
            min="0"
            class="inputtext light mb1"
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
              <button class="tagsmall" @click="removeEmail(index, $event)">
                {{ email }}
                <svg width="12" height="12"><use xlink:href="#i_x" /></svg>
              </button>
            </li>
          </ul>
        </div>
      </div>
      <FormErrorsList :errors="errors" />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1" />
        <button
          class="btn big"
          :disabled="isSubmitting || Object.keys(errors)?.length"
          :title="
            Object.keys(errors)?.length
              ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
              : null
          "
        >
          Salvar
        </button>
        <hr class="ml2 f1" />
      </div>
    </Form>
    <span v-if="chamadasPendentes?.emFoco" class="spinner">Carregando</span>

    <div v-if="erro" class="error p1">
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </div>
</template>
