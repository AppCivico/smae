import {
  lazy, mixed, object, string,
} from 'yup';

/**
 * Schema de teste com campos lazy para validar a extração de metadados.
 * Similar ao schema de meta que usa lazy() para campos condicionais.
 */
export default object().shape({
  campo_condicional: lazy(() => string()
    .label('Campo Condicional')
    .max(1000)
    .required()),

  campo_com_dependencia: lazy(() => {
    throw new Error('Lazy schema que depende de contexto específico');
  }),

  campo_normal: string()
    .label('Campo Normal')
    .max(500)
    .required(),

  campo_mixed: mixed().nullable(),
});
