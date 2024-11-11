<template>
  <div class="flex spacebetween center mb2 mt2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <CheckClose />
    <!-- :formulario-sujo="formularioSujo"
    :apenas-emitir="mostrarDistribuicaoRegistroForm"
    @close="fecharForm" -->
  </div>

  <div class="mb4">
    <form>
      <fieldset>
        <div class="mb1">
          <div class="f1 mb1 fb15em">
            <LabelFromYup
              name="gestor_municipal"
              :schema="schema"
            />
            <Field
              name="gestor_municipal"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.gestor_municipal }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="gestor_municipal"
            />
          </div>

          <div class="f1 mb1 fb15em">
            <LabelFromYup
              name="nome"
              :schema="schema"
            />
            <Field
              name="nome"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.nome }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="nome"
            />
          </div>

          <div class="f1 mb1 fb15em">
            <LabelFromYup
              name="objeto"
              :schema="schema"
            />
            <Field
              name="objeto"
              class="inputtext light mb1"
              as="textarea"
              rows="5"
              :class="{ 'error': errors.objeto }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="objeto"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1 fb15em">
            <LabelFromYup
              name="valor_repasse"
              :schema="schema"
            />
            <Field
              name="valor_repasse"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.valor_repasse }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="valor_repasse"
            />
          </div>

          <div class="f1 mb1 fb15em">
            <LabelFromYup
              name="custeio_porcento"
              :schema="schema"
            />

            <div class="flex center g1">
              <div>
                <Field
                  name="custeio_porcento"
                  class="inputtext light mb1"
                  type="text"
                  :class="{ 'error': errors.custeio_porcento }"
                />
                <ErrorMessage
                  class="error-msg mb1"
                  name="custeio_porcento"
                />
              </div>

              <span>OU</span>

              <div>
                <Field
                  name="custeio_bruto"
                  class="inputtext light mb1"
                  type="text"
                  :class="{ 'error': errors.custeio_bruto }"
                />

                <ErrorMessage
                  class="error-msg mb1"
                  name="custeio_bruto"
                />
              </div>
            </div>
          </div>

          <div class="f1 mb1 fb15em">
            <LabelFromYup
              name="investimento_porcento"
              :schema="schema"
            />

            <div class="flex center g1">
              <div>
                <Field
                  name="valor_repasse"
                  class="inputtext light mb1"
                  type="text"
                  :class="{ 'error': errors.valor_repasse }"
                />
                <ErrorMessage
                  class="error-msg mb1"
                  name="valor_repasse"
                />
              </div>

              <span>OU</span>

              <div>
                <Field
                  name="valor_repasse"
                  class="inputtext light mb1"
                  type="text"
                  :class="{ 'error': errors.valor_repasse }"
                />

                <ErrorMessage
                  class="error-msg mb1"
                  name="valor_repasse"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="valor_contrapartida"
              :schema="schema"
            />
            <Field
              name="valor_contrapartida"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.valor_contrapartida }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="valor_contrapartida"
            />
          </div>
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="valor_total"
              :schema="schema"
            />
            <Field
              name="valor_total"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.valor_total }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="valor_total"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="parlamentar.parlamentar_id"
              :schema="schema"
            />
            <Field
              name="valor_total"
              class="inputtext light mb1"
              as="select"
              :class="{ 'error': errors.parlamentar?.[0]?.parlamentar_id }"
            >
              <option value="">
                Selecione
              </option>
              <option value="1">
                1
              </option>
            </Field>
            <ErrorMessage
              class="error-msg mb1"
              name="parlamentar.parlamentar_id"
            />
          </div>

          <div class="f1 mb1">
            <LabelFromYup
              name="parlamentar.parlamentar_valor"
              :schema="schema"
            />
            <Field
              name="valor_total"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.parlamentar?.[0]?.parlamentar_valor }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="parlamentar.parlamentar_valor"
            />
          </div>
        </div>

        + adicionar
      </fieldset>

      <fieldset>
        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="programa_orcamentario_municipal"
              :schema="schema"
            />
            <Field
              name="programa_orcamentario_municipal"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.programa_orcamentario_municipal }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="programa_orcamentario_municipal"
            />
          </div>
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="programa_orcamentario_estadual"
              :schema="schema"
            />
            <Field
              name="programa_orcamentario_estadual"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.programa_orcamentario_estadual }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="programa_orcamentario_estadual"
            />
          </div>
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="dotacao"
              :schema="schema"
            />
            <Field
              name="dotacao"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.dotacao }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="dotacao"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="numero_sei.numero_sei_processo"
              :schema="schema"
            />
            <Field
              name="valor_total"
              class="inputtext light mb1"
              as="select"
              :class="{ 'error': errors.numero_sei?.[0]?.numero_sei_processo }"
            >
              <option value="">
                Selecione
              </option>
              <option value="1">
                1
              </option>
            </Field>
            <ErrorMessage
              class="error-msg mb1"
              name="numero_sei.numero_sei_processo"
            />
          </div>

          <div class="f1 mb1">
            <LabelFromYup
              name="numero_sei.numero_sei_nome"
              :schema="schema"
            />
            <Field
              name="valor_total"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.numero_sei?.[0]?.numero_sei_nome }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="numero_sei.numero_sei_nome"
            />
          </div>
        </div>

        + adicionar
      </fieldset>

      <fieldset>
        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="proposta"
              :schema="schema"
            />
            <Field
              name="proposta"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.proposta }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="proposta"
            />
          </div>

          <div class="f1 mb1">
            <LabelFromYup
              name="convenio"
              :schema="schema"
            />
            <Field
              name="convenio"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.convenio }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="convenio"
            />
          </div>
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="contrato"
              :schema="schema"
            />
            <Field
              name="contrato"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.contrato }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="contrato"
            />
          </div>

          <div class="f1 mb1">
            <LabelFromYup
              name="data_assinatura_aceite"
              :schema="schema"
            />
            <Field
              name="data_assinatura_aceite"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.data_assinatura_aceite }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="data_assinatura_aceite"
            />
          </div>
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="data_assinatura_estado"
              :schema="schema"
            />
            <Field
              name="data_assinatura_estado"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.data_assinatura_estado }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="data_assinatura_estado"
            />
          </div>

          <div class="f1 mb1">
            <LabelFromYup
              name="data_assinatura_munucipio"
              :schema="schema"
            />
            <Field
              name="data_assinatura_munucipio"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.data_assinatura_munucipio }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="data_assinatura_munucipio"
            />
          </div>
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 fb25 mb1">
            <LabelFromYup
              name="data_vigencia"
              :schema="schema"
            />
            <Field
              name="data_vigencia"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.data_vigencia }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="data_vigencia"
            />
          </div>

          <div class="f1 fb40 mb1">
            <LabelFromYup
              name="justificativa_atendimento"
              :schema="schema"
            />
            <Field
              name="justificativa_atendimento"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.justificativa_atendimento }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="justificativa_atendimento"
            />
          </div>

          <div class="f1 fb25 mb1">
            <LabelFromYup
              name="data_conclusao_suspensiva"
              :schema="schema"
            />
            <Field
              name="data_conclusao_suspensiva"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.data_conclusao_suspensiva }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="data_conclusao_suspensiva"
            />
          </div>
        </div>

        <h4>-LISTA DE JUSTIFICATIVAS-</h4>
      </fieldset>

      <fieldset>
        <legend>Registro status da distribuição de recursos</legend>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="status"
              :schema="schema"
            />
            <Field
              name="status"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.status }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="status"
            />
          </div>

          <div class="f1 mb1">
            <LabelFromYup
              name="data"
              :schema="schema"
            />
            <Field
              name="data"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.data }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="data"
            />
          </div>
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="orgao_responsavel"
              :schema="schema"
            />
            <Field
              name="orgao_responsavel"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.orgao_responsavel }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="orgao_responsavel"
            />
          </div>

          <div class="f1 mb1">
            <LabelFromYup
              name="responsavel"
              :schema="schema"
            />
            <Field
              name="responsavel"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.responsavel }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="responsavel"
            />
          </div>
        </div>

        <div class="flex flexwrap g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="motivo"
              :schema="schema"
            />
            <Field
              name="motivo"
              class="inputtext light mb1"
              type="text"
              :class="{ 'error': errors.motivo }"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="motivo"
            />
          </div>
        </div>
      </fieldset>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { transferenciaVoluntariaDistribuicaoDeRecursos as schema } from '@/consts/formSchemas';
import LabelFromYup from '@/components/LabelFromYup.vue';

const { values, errors } = useForm({
  validationSchema: schema,
});
</script>
