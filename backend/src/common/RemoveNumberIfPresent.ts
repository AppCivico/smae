export function RemoveNumberIfPresent<T extends number[] | undefined>(arr: T, num: number | undefined): T {
    if (arr === undefined || num === undefined) {
        return arr;
    }

    const filteredArray = arr.filter((item) => item !== num);

    // Cast the result back to T to maintain the original type
    return filteredArray as T;
}
