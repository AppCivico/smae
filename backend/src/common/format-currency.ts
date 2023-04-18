export class FormatCurrency {
    toString(value: number, locale = 'pt-BR', currency = 'BRL'): string {
        const formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            currencyDisplay: 'symbol', // or 'narrowSymbol', 'code' or 'name'
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        return formatter.format(value);
    }
}
