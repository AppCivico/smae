<script setup>
import { emailTransferencia as schema } from "@/consts/formSchemas";
import { useAlertStore } from "@/stores/alert.store";
import { useEmailsStore } from "@/stores/envioEmail.store";
import { storeToRefs } from "pinia";
import { Field, Form } from "vee-validate";
import { ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

const alertStore = useAlertStore();
const route = useRoute();
const router = useRouter();
const emailsStore = useEmailsStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(emailsStore);
const newEmail = ref("");
const localEmails = ref([]);

const periodicidades = ["Dias", "Semanas", "Meses", "Anos"];

function removeEmail(index, event) {
  event.preventDefault();
  localEmails.value.splice(index, 1);
}

function addNewEmail() {
  if(newEmail.value === "" || !newEmail.value){
    return
  }

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

async function onSubmit({comcopia, ...values}) {
  addNewEmail()
  const valoresAuxiliares = {
    ...values,
    ativo: values.ativo === undefined ? false : true,
    numero: parseInt(values.numero),
    recorrencia_dias: parseInt(values.recorrencia_dias),
    com_copia: localEmails.value ? localEmails.value.slice() : [],
    tipo: "CronogramaTerminoPlanejado",
  };
  if (route.params.tarefaId) {
    valoresAuxiliares.tarefa_id = parseInt(route.params.tarefaId);
  } else if (route.params.transferenciaId) {
    valoresAuxiliares.transferencia_id = parseInt(route.params.transferenciaId);
  }
  try {
    let resposta;
    const msg = "Dados salvos com sucesso!";
    resposta = await emailsStore.salvarItem(valoresAuxiliares);
    if (resposta) {
      alertStore.success(msg);
      if (route.params.tarefaId) {
        emailsStore.buscarItem({ tarefa_id: route.params.tarefaId });
      } else if (route.params.transferenciaId) {
        emailsStore.buscarItem({transferencia_id: route.params.transferenciaId});
      }
      if(route.meta.rotaDeEscape){
         router.push({ name: route.meta.rotaDeEscape });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

watchEffect(() => {
  localEmails.value = itemParaEdicao?.value?.linhas?.[0]?.com_copia;
})

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
      :initial-values="itemParaEdicao?.linhas?.[0]"
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
            type="email"
            name="comcopia"
            class="inputtext light mb1"
            maxlength="250"
            placeholder="email@dominio.com"
            @blur="addNewEmail()"
            @keydown.enter.prevent="addNewEmail()"
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
