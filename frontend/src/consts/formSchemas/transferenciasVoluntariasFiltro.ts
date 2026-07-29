import {
  number, object, string,
} from './initSchema';

export default object().shape({
  ano: number()
    .label('Ano')
    .nullableOuVazio(),
  cancelada: string()
    .label('Cancelada')
    .nullableOuVazio(),
  esfera: string()
    .label('Esfera')
    .nullableOuVazio(),
  palavra_chave: string()
    .label('Palavra-chave')
    .nullableOuVazio(),
  preenchimento_completo: string()
    .label('Preenchimento completo')
    .nullableOuVazio(),
});
