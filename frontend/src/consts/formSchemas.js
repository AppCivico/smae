import regEx from '@/consts/patterns';
import { boolean, object, string } from 'yup';

const relatórioOrçamentário = object({
  fonte: string().required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string().required('Escolha um PdM'),
    inicio: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
    fim: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
    tipo: string().required('Escolha o tipo'),
  })
});

export { relatórioOrçamentário };
