export function UniqueNumbers<T extends number[] | undefined | null>(input: T): T {
    if (input === undefined || input === null) {
        return input;
    }
    return Array.from(new Set(input)) as T;
}
