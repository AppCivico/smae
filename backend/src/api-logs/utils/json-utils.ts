export function tryDecodeJson(str: string | null | undefined): string | object | null | undefined {
    if (!str) return str;
    try {
        return JSON.parse(str);
    } catch {
        return str;
    }
}
