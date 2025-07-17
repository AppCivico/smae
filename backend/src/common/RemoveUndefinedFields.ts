function RemoveUndefinedFields<T>(dto: T): T {
    const cleaned: any = {};
    for (const key in dto) {
        if (dto[key] !== undefined) {
            cleaned[key] = dto[key];
        }
    }
    return cleaned as T;
}
