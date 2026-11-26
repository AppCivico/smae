/** Quotes user input as a single to_tsquery() lexeme ('text'), so no character acts as tsquery syntax. */
export function quoteTsQueryLexeme(text: string): string {
    return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}
