// Espelha MAX_LENGTH_HTML de backend/src/common/consts.ts, que não pode ser
// importado aqui porque depende do @prisma/client. Conta o HTML, não só o texto.
export const LIMITE_CAMPO_HTML = 10240;

// Espelha MAX_LENGTH_MEDIO e MAX_LENGTH_LONG, usados por alguns campos HTML no backend
export const LIMITE_CAMPO_MEDIO = 2048;
export const LIMITE_CAMPO_LONGO = 23000;

// o limite conta o HTML, então falar em "caracteres" confunde quem vê só o texto
export const mensagemDeLimiteHtml = ({ label }: { label?: string }) => (label
  ? `${label} excedeu o tamanho máximo.`
  : 'O campo excedeu o tamanho máximo.');
