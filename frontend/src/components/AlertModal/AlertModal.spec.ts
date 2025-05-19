import autofocus from '@/diretivas/autofocus';
import { useAlertStore } from '@/stores/alert.store';
import { createTestingPinia } from '@pinia/testing';
import { mount, RouterLinkStub } from '@vue/test-utils';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { nextTick } from 'vue';
import AlertModal from './AlertModal.vue';

const montar = () => mount(AlertModal, {
  attachTo: document.body,
  global: {
    directives: {
      focus: autofocus,
    },
    plugins: [createTestingPinia({
      stubActions: false,
      createSpy: vi.fn,
    })],
    stubs: {
      RouterLink: RouterLinkStub,
    },
  },
});

describe('AlertModal', () => {
  let envelope: ReturnType<typeof montar>;

  afterEach(() => {
    if (envelope) {
      envelope.unmount();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('monta apenas um diálogo para uma mensagem de sucesso', async () => {
    envelope = montar();
    const alertStore = useAlertStore();

    alertStore.success('Testando abertura!');

    await nextTick();

    const dialogos = envelope.findAll('dialog');
    expect(dialogos).toHaveLength(1);
    expect(dialogos[0].attributes('open')).toBeDefined();
    expect(dialogos[0].classes()).toContain('alert-success');

    const mensagens = envelope.findAll('[data-test="mensagem"]');
    expect(mensagens).toHaveLength(1);
    expect(mensagens[0].text()).toBe('Testando abertura!');
  });

  it('monta apenas um diálogo para uma mensagem de erro', async () => {
    envelope = montar();

    const alertStore = useAlertStore();

    alertStore.error('Testando mensagem de erro!');

    await nextTick();

    const dialogos = envelope.findAll('dialog');
    expect(dialogos).toHaveLength(1);
    expect(dialogos[0].attributes('open')).toBeDefined();
    expect(dialogos[0].classes()).toContain('alert-danger');

    const mensagens = envelope.findAll('[data-test="mensagem"]');
    expect(mensagens).toHaveLength(1);
    expect(mensagens[0].text()).toBe('Testando mensagem de erro!');
  });

  it('abre e fecha o diálogo', async () => {
    envelope = montar();

    const alertStore = useAlertStore();

    alertStore.success('Testando abertura e fechamento!');

    await nextTick();

    expect(envelope.find('dialog').exists()).toBe(true);

    const botaoDeAceite = envelope.get('[data-test="aceite"]');

    await botaoDeAceite.trigger('click');

    await nextTick();
    expect(envelope.find('dialog').exists()).toBe(false);
  });

  it('seleciona o botão de aceite automaticamente', async () => {
    envelope = montar();

    const alertStore = useAlertStore();

    alertStore.success('Testando abertura e fechamento!');

    await nextTick();

    expect(envelope.find('dialog').exists()).toBe(true);

    const botaoDeAceite = envelope.get('[data-test="aceite"]');
    // esperando a diretiva de foco executar
    await nextTick();

    expect(document.activeElement).toBe(botaoDeAceite.element);
  });

  it('monta múltiplos diálogos consecutivos', async () => {
    envelope = montar();

    const alertStore = useAlertStore();

    alertStore.success('Testando abertura!');
    await nextTick();
    alertStore.success('Testando abertura + 1!');
    await nextTick();
    alertStore.success('Testando abertura + 2!');
    alertStore.success('Testando abertura + 3!');
    alertStore.success('Testando abertura + 4!');

    await nextTick();

    const dialogos = envelope.findAll('dialog');
    expect(dialogos).toHaveLength(5);
    expect(dialogos[4].attributes('open')).toBeDefined();
    expect(dialogos[4].classes()).toContain('alert-success');
    expect(dialogos[3].attributes('open')).toBeUndefined();

    await dialogos[4].get('[data-test="aceite"]').trigger('click');
    await nextTick();

    expect(envelope.findAll('dialog')).toHaveLength(4);
    expect(dialogos[3].attributes('open')).toBeDefined();
    expect(dialogos[2].attributes('open')).toBeUndefined();
  });

  it('exibe um diálogo de confirmação com saída para uma URL', async () => {
    envelope = montar();
    const alertStore = useAlertStore();

    alertStore.confirm('Testando confirmação!', '#teste');

    await nextTick();

    const dialogo = envelope.get('dialog');
    expect(dialogo.attributes('open')).toBeDefined();
    expect(dialogo.classes()).toContain('confirm');

    const linkDeAceite = envelope.findComponent(RouterLinkStub);
    expect(linkDeAceite.props().to).toBe('#teste');
  });

  it('exibe um diálogo de confirmação com saída para uma função', async () => {
    const spyCallback = vi.fn();

    envelope = montar();
    const alertStore = useAlertStore();

    alertStore.confirm('Testando confirmação!', spyCallback);

    await nextTick();

    const dialogo = envelope.get('dialog');
    expect(dialogo.attributes('open')).toBeDefined();
    expect(dialogo.classes()).toContain('confirm');
    const botaoDeAceite = envelope.get('[data-test="aceite"]');

    await nextTick();

    expect(document.activeElement).toBe(botaoDeAceite.element);

    await botaoDeAceite.trigger('click');

    expect(spyCallback).toHaveBeenCalled();

    expect(envelope.find('dialog').exists()).toBe(false);
  });

  it('exibe um diálogo de confirmação com função de secundária', async () => {
    const spyCallback = vi.fn();
    const spyFallback = vi.fn();

    envelope = montar();
    const alertStore = useAlertStore();

    alertStore.confirmAction('Testando confirmação!', spyCallback, 'aceitar', spyFallback);

    await nextTick();

    const dialogo = envelope.get('dialog');
    expect(dialogo.attributes('open')).toBeDefined();
    expect(dialogo.classes()).toContain('confirmAction');
    const botaoDeAceite = envelope.get('[data-test="aceite"]');
    const botaoDeEscape = envelope.get('[data-test="escape"]');

    expect(botaoDeAceite.text()).toBe('aceitar');

    await nextTick();

    expect(document.activeElement).toBe(botaoDeAceite.element);

    await botaoDeEscape.trigger('click');

    expect(spyCallback).not.toHaveBeenCalled();
    expect(spyFallback).toHaveBeenCalled();

    expect(envelope.find('dialog').exists()).toBe(false);
  });
});
