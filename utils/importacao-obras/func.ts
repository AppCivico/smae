export function matchStringFuzzy(str1: string | undefined | null, str2: string | undefined | null): boolean {
    if (!str1 || !str2) {
        return false;
    }

    const normalizeString = (str: string): string => {
        let tmp = str
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        tmp = tmp.replace(/\s+/g, ' ');
        tmp = tmp.replace(/[^a-z0-9 ]/g, '');
        // remove left zero
        tmp = tmp.replace(/^0+/, '');

        return tmp;
    };

    return normalizeString(str1) === normalizeString(str2);
}
