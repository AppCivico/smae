import nulificadorTotal from './nulificadorTotal';

export default (formulario: HTMLFormElement): Record<string, string> => {
  const objetoFormulario: Record<string, string> = {};

  let i = 0;

  while (formulario.elements[i]) {
    const campo = formulario.elements[i] as HTMLInputElement;

    objetoFormulario[campo.name] = campo.value;

    i += 1;
  }

  return nulificadorTotal(objetoFormulario);
};
