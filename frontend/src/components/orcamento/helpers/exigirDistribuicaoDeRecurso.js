import { mixed } from 'yup';

export const MENSAGEM_DE_DISTRIBUICAO_OBRIGATORIA = 'Escolha a transferência ou uma distribuição de recursos.';

// `null` (a própria transferência) é uma escolha válida; só a ausência de
// escolha (`undefined`) não é
export function distribuicaoFoiEscolhida(valor) {
  return valor !== undefined;
}

// com um schema no formulário, o vee-validate ignora as `rules` do campo;
// por isso a obrigatoriedade também precisa entrar no schema da tela
export default function exigirDistribuicaoDeRecurso(schema) {
  return schema.shape({
    distribuicao_recurso_id: mixed()
      .nullable()
      .test(
        'distribuicao-escolhida',
        MENSAGEM_DE_DISTRIBUICAO_OBRIGATORIA,
        distribuicaoFoiEscolhida,
      ),
  });
}
