import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import interfacesDeTransferências from '@/consts/interfacesDeTransferências';
import { useOrgansStore } from '@/stores/organs.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { usePdMStore } from '@/stores/pdm.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTagsStore } from '@/stores/tags.store';

const ÓrgãosStore = useOrgansStore();
const partidosStore = usePartidosStore();
const PdMStore = usePdMStore();
const portfolioStore = usePortfolioStore();
const portfolioObrasStore = usePortfolioObraStore();
const projetosStore = useProjetosStore();
const TagsStore = useTagsStore();

export const prepararEsferaDeTransferência = () => Object.values(esferasDeTransferencia)
  .reduce((acc, cur) => ({ ...acc, [cur.valor]: cur.nome }), {});

export const prepararEtiquetas = (schema) => Object.keys(schema.fields.parametros.fields)
  .reduce((acc, cur) => ({ ...acc, [cur]: schema.fields.parametros.fields[cur].spec.label }), {});

export const prepararInterfaceDeTransferência = () => Object.values(interfacesDeTransferências)
  .reduce((acc, cur) => ({ ...acc, [cur.valor]: cur.nome }), {});

export const prepararCargos = () => Object.values(cargosDeParlamentar)
  .reduce((acc, cur) => ({ ...acc, [cur.valor]: cur.nome }), {});

ÓrgãosStore.getAll()
  .then(() => ÓrgãosStore.órgãosComoLista
    .reduce((acc, cur) => ({ ...acc, [cur.id]: cur.sigla }), {}))
  .catch((error) => {
    throw new Error(error);
  });

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

// menos enxuto, mas evita chamadas sem necessidade
export const prepararPartidos = async () => {
  try {
    if (!partidosStore.lista.length) {
      await partidosStore.buscarTudo();
    }
    return partidosStore.lista.reduce((acc, cur) => ({
      ...acc,
      [cur.id]: cur.nome,
    }), {});
  } catch (error) {
    throw new Error(error);
  }
};

export const prepararPortfolios = () => portfolioStore.buscarTudo()
  .then(() => portfolioStore.lista.reduce((acc, cur) => ({
    ...acc,
    [cur.id]: cur.titulo,
  }), {}))
  .catch((error) => {
    throw new Error(error);
  });
export const prepararPortfoliosObras = () => portfolioObrasStore.buscarTudo()
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
