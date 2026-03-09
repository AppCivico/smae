import {
  object,
  setLocale,
  string,
} from 'yup';
import i18n from '@/consts/formSchemas/config/i18n';

setLocale(i18n);

export default object()
  .shape({
    palavra_chave: string()
      .label('Termo de busca')
      .max(100)
      .nullable()
      .trim(),
  })
  .defined()
  .noUnknown(true, 'Campos desconhecidos não são permitidos')
  .strict(true);
