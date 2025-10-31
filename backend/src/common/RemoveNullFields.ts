export function RemoveNullFields<T>(dto: T): T {
    const cleaned: any = {};
    for (const key in dto) {
        if (dto[key] !== null) {
            cleaned[key] = dto[key];
        }
    }
    return cleaned as T;
}
