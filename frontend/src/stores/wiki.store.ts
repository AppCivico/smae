import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type WikiItem = {
  chave_smae: string;
  url_wiki: string;
};

interface Estado {
  paginas: WikiItem[];
  paginaSmae: string;
}

export const useWikiStore = defineStore('wiki', {
  state: (): Estado => ({
    paginas: [],
    paginaSmae: '/',
  }),
  actions: {
    async buscar(): Promise<void> {
      const response = (await this.requestS.get(
        `${baseUrl}/wiki-link`,
      )) as WikiItem[];

      this.paginas = response;
    },
    selecionarPaginaAtual(paginaAtual: string | undefined) {
      if (!paginaAtual) {
        return;
      }

      this.paginaSmae = paginaAtual;
    },
  },
  getters: {
    paginasMapeadas: ({ paginas }) => paginas.reduce(
      (mapa, item) => {
        // eslint-disable-next-line no-param-reassign
        mapa[item.chave_smae] = item.url_wiki;

        return mapa;
      },
      {} as Record<string, string>,
    ),
    wikiAtual: ({ paginasMapeadas, paginaSmae }): string | null => {
      const paginaWiki: string | undefined = paginasMapeadas[paginaSmae];
      if (!paginaWiki) {
        return null;
      }

      return paginaWiki;
    },
  },
});
