import nulificadorTotal from './nulificadorTotal';

export default (event: SubmitEvent, excluirVazios = false): Record<string, unknown> => {
  const formData = new FormData(event.target as HTMLFormElement);

  const objetoFormulario: { [k: string]: FormDataEntryValue } = Object.fromEntries(formData);

  return excluirVazios
    ? Object.fromEntries(Object.entries(objetoFormulario).filter(([, valor]) => valor !== ''))
    : nulificadorTotal(objetoFormulario);
};
