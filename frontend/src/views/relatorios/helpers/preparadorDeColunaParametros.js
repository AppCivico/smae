import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useOrgansStore } from '@/stores/organs.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTagsStore } from '@/stores/tags.store';
import { usePdMStore } from '@/stores/pdm.store';

const ÓrgãosStore = useOrgansStore();
const PdMStore = usePdMStore();
const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const TagsStore = useTagsStore();

export const prepararEtiquetas = (schema) => Object.keys(schema.fields.parametros.fields)
  .reduce((acc, cur) => ({ ...acc, [cur]: schema.fields.parametros.fields[cur].spec.label }), {});

export const prepararÓrgãos = () => ÓrgãosStore.getAll()
  .then(() => ÓrgãosStore.órgãosComoLista
    .reduce((acc, cur) => ({ ...acc, [cur.id]: cur.sigla }), {}))
  .catch((error) => {
    throw new Error(error);
  });

export const prepararPdm = () => PdMStore.getAll()
  .then(() => (Array.isArray(PdMStore.PdM)
    ? PdMStore.PdM.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.nome }), {})
    : {}))
  .catch((error) => {
    throw new Error(error);
  });

export const prepararPortfolios = () => portfolioStore.buscarTudo()
  .then(() => portfolioStore.lista.reduce((acc, cur) => ({
    ...acc,
    [cur.id]: cur.titulo,
  }), {}))
  .catch((error) => {
    throw new Error(error);
  });

export const prepararProjetos = () => projetosStore.buscarTudo()
  .then(() => projetosStore.lista.reduce((acc, cur) => ({
    ...acc,
    [cur.id]: cur.nome,
  }), {}))
  .catch((error) => {
    throw new Error(error);
  });

export const prepararTags = () => TagsStore.getAll()
  .then(() => (Array.isArray(TagsStore.Tags)
    ? TagsStore.Tags.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.descricao }), {})
    : {}))
  .catch((error) => {
    throw new Error(error);
  });


