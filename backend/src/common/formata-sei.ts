export function formataSEI(input: string): string {
    const numero = input.replace(/\D/g, '');

    // TODO: validação de tamanhos

    const part1 = numero.slice(0, 4);
    const part2 = numero.slice(4, 8);
    const part3 = numero.slice(8, 14);

    let seiFormatado = `${part1}.${part2}/${part3}`;

    if (numero.length > 13) {
        const part4 = numero.slice(14, 15);
        seiFormatado += `-${part4}`;
    }

    return seiFormatado;
}
