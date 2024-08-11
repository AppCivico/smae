import nulificadorTotal from './nulificadorTotal';

export default (event: SubmitEvent): Record<string, unknown> => {
  const formData = new FormData(event.target as HTMLFormElement);

  const objetoFormulario: { [k: string]: FormDataEntryValue } = Object.fromEntries(formData);

  return nulificadorTotal(objetoFormulario);
};
