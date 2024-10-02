export type FaseOpcoes = 'cadastro' | 'aprovacao' | 'liberacao';
export type FormularioSituacao = {
  exibir: boolean;
  liberado: boolean;
};

export type FormulariosTiposPosicao = {
  [key in FaseOpcoes]: number;
};

export type FormulariosTiposSituacao = {
  [key in FaseOpcoes]: FormularioSituacao;
};
