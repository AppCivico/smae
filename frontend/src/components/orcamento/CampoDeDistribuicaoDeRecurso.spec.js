import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { useForm } from 'vee-validate';
import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import { defineComponent, h } from 'vue';
import { object, string } from 'yup';

import CampoDeDistribuicaoDeRecurso from './CampoDeDistribuicaoDeRecurso.vue';
import exigirDistribuicaoDeRecurso from './helpers/exigirDistribuicaoDeRecurso';

const distribuicoes = [
  { id: 7, nome: 'Reforma da UBS', orgao_gestor: { sigla: 'SMS' } },
  { id: 9, nome: null, objeto: 'Pavimentação' },
];

const transferencia = { id: 320, identificador: '12/2024', objeto: 'Aquisição de ambulâncias' };

function opcoesDeMontagem(emFoco = transferencia) {
  return {
    global: {
      plugins: [createTestingPinia({
        createSpy: vi.fn,
        initialState: { transferenciasVoluntarias: { emFoco } },
      })],
    },
  };
}

function montar(initialValues = {}, lista = distribuicoes, emFoco = transferencia) {
  let valoresDoFormulario;

  const Formulario = defineComponent({
    setup() {
      const { values } = useForm({ initialValues });
      valoresDoFormulario = values;

      return () => h(CampoDeDistribuicaoDeRecurso, { distribuicoes: lista });
    },
  });

  const wrapper = mount(Formulario, opcoesDeMontagem(emFoco));

  return { wrapper, valores: () => valoresDoFormulario };
}

const rotulos = (wrapper) => wrapper.findAll('label').map((x) => x.text());

describe('CampoDeDistribuicaoDeRecurso', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('oferece a transferência e cada distribuição como opções de rádio', () => {
    const { wrapper } = montar();

    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(3);
    expect(rotulos(wrapper)).toEqual([
      '12/2024 - Aquisição de ambulâncias',
      'Reforma da UBS - SMS',
      'Pavimentação',
    ]);
  });

  it('exibe "Transferência" como subtítulo, como "Meta" nos demais módulos', () => {
    const { wrapper } = montar();

    expect(wrapper.findAll('[role="radiogroup"] div.label.tc300').map((x) => x.text()))
      .toEqual(['Transferência', 'Distribuições de recursos']);
  });

  it('sem transferência carregada, usa um rótulo genérico', () => {
    const { wrapper } = montar({}, distribuicoes, null);

    expect(wrapper.find('[data-test="opcao-transferencia"]').element.closest('label').textContent.trim())
      .toBe('Esta transferência');
  });

  it('agrupa as opções num único grupo de rádios, com rótulo acessível', () => {
    const { wrapper } = montar();

    const grupo = wrapper.find('[role="radiogroup"]');
    const rotulo = wrapper.find(`#${grupo.attributes('aria-labelledby')}`);

    expect(rotulo.text()).toBe('Vincular dotação*');
    expect(new Set(wrapper.findAll('input[type="radio"]').map((x) => x.attributes('name'))))
      .toEqual(new Set(['distribuicao_recurso_id']));
  });

  it('começa sem nenhuma opção marcada', () => {
    const { wrapper } = montar();

    expect(wrapper.findAll('input[type="radio"]').some((x) => x.element.checked)).toBe(false);
  });

  it('indica que é obrigatório', () => {
    const { wrapper } = montar();

    expect(wrapper.find('[role="radiogroup"] .tvermelho').text()).toBe('*');
  });

  describe('obrigatoriedade', () => {
    // as telas de inclusão têm seu próprio schema yup; com schema, o
    // vee-validate ignora as `rules` do campo, por isso o schema é estendido
    function montarComSchema(initialValues = {}, validationSchema = undefined) {
      let enviar;
      let enviado;

      const Formulario = defineComponent({
        setup() {
          const { handleSubmit, errors } = useForm({
            initialValues,
            validationSchema: validationSchema === undefined
              ? exigirDistribuicaoDeRecurso(object({ dotacao: string() }))
              : validationSchema,
          });
          enviar = handleSubmit((valores) => { enviado = valores; });

          return () => h('form', [
            h(CampoDeDistribuicaoDeRecurso, { distribuicoes }),
            h('output', errors.value.distribuicao_recurso_id || ''),
          ]);
        },
      });

      const wrapper = mount(Formulario, opcoesDeMontagem());

      return { wrapper, enviar: () => enviar(), enviado: () => enviado };
    }

    it('impede o envio sem escolha e exibe a mensagem', async () => {
      const { wrapper, enviar, enviado } = montarComSchema();

      await enviar();
      await flushPromises();

      expect(enviado()).toBeUndefined();
      expect(wrapper.find('.error-msg').text())
        .toBe('Escolha a transferência ou uma distribuição de recursos.');
    });

    it('sem schema no formulário, as regras do próprio campo exigem a escolha', async () => {
      const { wrapper, enviar, enviado } = montarComSchema({}, null);

      await enviar();
      await flushPromises();

      expect(enviado()).toBeUndefined();
      expect(wrapper.find('.error-msg').text())
        .toBe('Escolha a transferência ou uma distribuição de recursos.');
    });

    it('aceita a transferência como escolha', async () => {
      const { wrapper, enviar, enviado } = montarComSchema();

      await wrapper.find('[data-test="opcao-transferencia"]').setValue(true);
      await enviar();
      await flushPromises();

      expect(enviado()).toMatchObject({ distribuicao_recurso_id: null });
    });

    it('aceita uma distribuição como escolha', async () => {
      const { wrapper, enviar, enviado } = montarComSchema();

      await wrapper.find('[data-test="opcao-distribuicao-7"]').setValue(true);
      await enviar();
      await flushPromises();

      expect(enviado()).toMatchObject({ distribuicao_recurso_id: 7 });
    });
  });

  it('não exibe o subtítulo das distribuições quando não há nenhuma', () => {
    const { wrapper } = montar({}, []);

    expect(wrapper.text()).not.toContain('Distribuições de recursos');
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(1);
  });

  it('grava o id numérico da distribuição escolhida', async () => {
    const { wrapper, valores } = montar();

    await wrapper.find('[data-test="opcao-distribuicao-9"]').setValue(true);
    await flushPromises();

    expect(valores().distribuicao_recurso_id).toBe(9);
    expect(wrapper.find('[data-test="opcao-transferencia"]').element.checked).toBe(false);
  });

  it('grava `null` ao voltar para a transferência', async () => {
    const { wrapper, valores } = montar({ distribuicao_recurso_id: 7 });

    expect(wrapper.find('[data-test="opcao-distribuicao-7"]').element.checked).toBe(true);

    await wrapper.find('[data-test="opcao-transferencia"]').setValue(true);
    await flushPromises();

    expect(valores().distribuicao_recurso_id).toBeNull();
  });
});
