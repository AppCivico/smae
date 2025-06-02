export function tryDecodeJson(str: string | null | undefined): string | object | null {
    if (!str) return {};
    try {
        return JSON.parse(str);
    } catch {
        return {};
    }
}
