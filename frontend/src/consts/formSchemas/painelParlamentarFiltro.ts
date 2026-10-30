import { number, object, ref } from './initSchema';

export default object().shape({
  ano_inicio: number()
    .label('Início do período')
    .nullableOuVazio(),
  ano_fim: number()
    .label('Fim do período')
    .min(ref('ano_inicio'), 'Fim do período não pode ser anterior ao início')
    .nullableOuVazio(),
});
