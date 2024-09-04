export function CheckArrayContains(item: string | number | bigint, arr: string[] | number[] | bigint[]): boolean {
    return arr.map((r) => r.toString()).includes(item.toString());
}
