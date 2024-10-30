// formata a nota, tirando sempre o zero a esquerda, pra
// caso mude de 5 pra 6, ou de 6 pra 7 digitos, não precise reprocessar o banco novamente
export function FormataNotaEmpenho(nota: string): string {
    nota = nota.replace(/[^0-9\\/]/g, '');
    const split = nota.split('/');

    return `${+split[0]}/${split[1]}`;
}
