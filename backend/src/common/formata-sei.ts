export function formataSEI(input: string): string {
    // Check if the input contains the pipe character
    if (input.includes('|')) {
        // Split the input by pipe and recursively call formataSEI on each part
        return input.split('|')
            .map(part => formataSEI(part.trim()))
            .filter(Boolean)  // Remove empty results
            .join(' | ');     // Join the formatted parts with pipes
    }

    const numero = input.replace(/\D/g, '');

    // TODO: validação de tamanhos

    const part1 = numero.slice(0, 4);
    const part2 = numero.slice(4, 8);
    const part3 = numero.slice(8, 15);

    let seiFormatado = `${part1}.${part2}/${part3}`;

    if (numero.length > 15) {
        const part4 = numero.slice(15, 16);
        seiFormatado += `-${part4}`;
    }

    return seiFormatado;
}
