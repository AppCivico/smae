import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { nextTick, ref } from 'vue';

import { useTiposDeDocumentosStore } from '@/stores/tiposDeDocumentos.store';

import UploadDeArquivosEmLista from './UploadDeArquivosEmLista.vue';

const uploadArquivo = vi.fn();

vi.mock('@/composables/useUpload', () => ({
  useUpload: () => ({
    uploadArquivo,
    obterUrlDownload: (token: string) => `/download/${token}`,
    carregando: ref(false),
    erro: ref<unknown>(null),
  }),
}));

type EstadoDosTipos = {
  lista?: { id: number; titulo: string; extensoes: string | null }[];
  pendente?: boolean;
};

function montar(props: Record<string, unknown>, estado: EstadoDosTipos = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      tiposDeDocumentos: {
        lista: estado.lista ?? [],
        chamadasPendentes: { lista: estado.pendente ?? false, emFoco: false },
      },
    },
  });

  const envelope = mount(UploadDeArquivosEmLista, {
    props,
    global: {
      plugins: [pinia],
      stubs: { SmaeLink: true },
    },
  });

  return { envelope, store: useTiposDeDocumentosStore() };
}

async function escolherArquivo(envelope: ReturnType<typeof montar>['envelope'], nome: string) {
  const input = envelope.find('input[type="file"]');
  Object.defineProperty(input.element, 'files', {
    value: [new File(['conteudo'], nome)],
    configurable: true,
  });
  await input.trigger('change');
  await flushPromises();
}

const botaoDeAdicionar = (envelope: ReturnType<typeof montar>['envelope']) => envelope
  .find('button.addlink');

describe('UploadDeArquivosEmLista com tipo DOCUMENTO', () => {
  beforeEach(() => {
    uploadArquivo.mockResolvedValue('token-novo');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('busca os tipos de documento mesmo com `tipoDocumentoId` vindo por prop', () => {
    const { envelope, store } = montar({ tipo: 'DOCUMENTO', tipoDocumentoId: 7 });

    expect(store.buscarTudo).toHaveBeenCalledTimes(1);
    expect(envelope.find('select').exists()).toBe(false);
  });

  it('não busca os tipos quando `fnAdicionar` faz o envio', () => {
    const { store } = montar({
      tipo: 'DOCUMENTO',
      tipoDocumentoId: 7,
      fnAdicionar: vi.fn(),
    });

    expect(store.buscarTudo).not.toHaveBeenCalled();
  });

  it('bloqueia o envio enquanto o tipo está sendo carregado', async () => {
    const { envelope } = montar({ tipo: 'DOCUMENTO', tipoDocumentoId: 7 }, { pendente: true });

    expect(botaoDeAdicionar(envelope).attributes('disabled')).toBeDefined();
    expect(botaoDeAdicionar(envelope).attributes('title')).toBe('Carregando o tipo de documento…');

    await escolherArquivo(envelope, 'qualquer.xyz');
    expect(uploadArquivo).not.toHaveBeenCalled();
  });

  it('não trata falha no carregamento como "qualquer extensão" e permite tentar de novo', async () => {
    const { envelope, store } = montar({ tipo: 'DOCUMENTO', tipoDocumentoId: 7 });
    vi.mocked(store.buscarTudo).mockClear();

    expect(botaoDeAdicionar(envelope).attributes('disabled')).toBeDefined();

    await escolherArquivo(envelope, 'qualquer.xyz');
    expect(uploadArquivo).not.toHaveBeenCalled();

    const tentarDeNovo = envelope.findAll('button').find((b) => b.text() === 'Tentar novamente');
    if (!tentarDeNovo) throw new Error('Botão "Tentar novamente" ausente');
    await tentarDeNovo.trigger('click');
    expect(store.buscarTudo).toHaveBeenCalledTimes(1);
  });

  it('recusa arquivo fora das extensões do tipo e envia os permitidos', async () => {
    const { envelope } = montar(
      { tipo: 'DOCUMENTO', tipoDocumentoId: 7 },
      { lista: [{ id: 7, titulo: 'Ofício', extensoes: 'pdf' }] },
    );

    expect(botaoDeAdicionar(envelope).attributes('disabled')).toBeUndefined();
    expect(botaoDeAdicionar(envelope).text()).toContain('(.pdf)');
    expect(envelope.find('input[type="file"]').attributes('accept')).toBe('.pdf');

    await escolherArquivo(envelope, 'planilha.xlsx');
    expect(uploadArquivo).not.toHaveBeenCalled();
    expect(envelope.find('.upload-erro').text()).toContain('Extensões permitidas: .pdf');

    await escolherArquivo(envelope, 'oficio.PDF');
    expect(uploadArquivo).toHaveBeenCalledWith(expect.any(File), 'DOCUMENTO', { tipoDocumentoId: 7 });
  });

  it('aceita qualquer extensão só quando o tipo encontrado não restringe', async () => {
    const { envelope } = montar(
      { tipo: 'DOCUMENTO', tipoDocumentoId: 7 },
      { lista: [{ id: 7, titulo: 'Outros', extensoes: null }] },
    );

    expect(envelope.find('input[type="file"]').attributes('accept')).toBeUndefined();

    await escolherArquivo(envelope, 'qualquer.xyz');
    expect(uploadArquivo).toHaveBeenCalledTimes(1);
  });

  it('exige a escolha do tipo quando ele não vem por prop', async () => {
    const { envelope } = montar(
      { tipo: 'DOCUMENTO' },
      { lista: [{ id: 3, titulo: 'Ata', extensoes: 'docx' }] },
    );

    expect(botaoDeAdicionar(envelope).attributes('disabled')).toBeDefined();

    await envelope.find('select').setValue('3');
    await nextTick();

    expect(botaoDeAdicionar(envelope).attributes('disabled')).toBeUndefined();
    expect(botaoDeAdicionar(envelope).text()).toContain('(.docx)');
  });
});
