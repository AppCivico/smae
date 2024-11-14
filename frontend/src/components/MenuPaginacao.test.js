import { mount, RouterLinkStub } from '@vue/test-utils';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import Componente from './MenuPaginacao.vue';

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    query: {},
  })),
  useRouter: vi.fn(() => ({
    push: () => {},
  })),
  $route: {
    query: {},
  },
}));

describe('MenuPaginacao', () => {
  test('se o Menu de paginação monta vazio quando não há páginas', () => {
    const envelope = mount(Componente, {
      props: {
      },
      global: {
        stubs: ['router-link'],
      },
    });

    expect(envelope.find('[data-test="menu-paginacao"]').exists()).toBe(false);
  });

  test('se o Menu de paginação monta cheio', () => {
    const envelope = mount(Componente, {
      props: {
        paginas: 10,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        mocks: {
          $route: {
            query: {
              pagina: 1,
            },
          },
        },
      },
    });

    expect(envelope.find('[data-test="menu-paginacao"]').exists()).toBe(true);
    expect(envelope.findComponent('[data-test="link-paginacao-anterior"]').props('to').query?.pagina).toBe(0);
    expect(envelope.findComponent('[data-test="link-paginacao-seguinte"]').props('to').query?.pagina).toBe(2);
  });
});
