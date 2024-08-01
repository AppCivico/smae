export function matchStringFuzzy(str1: string | undefined | null, str2: string | undefined | null): boolean {
    if (!str1 || !str2) {
        return false;
    }

    const normalizeString = (str: string): string => {
        let tmp = str
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        // remove ' de '
        tmp = tmp.replace(/ de /g, ' ');
        // remove ' da '
        tmp = tmp.replace(/ da /g, ' ');
        // remove ' do '
        tmp = tmp.replace(/ do /g, ' ');
        // remove ' dos '
        tmp = tmp.replace(/ dos /g, ' ');
        // remove ' das '
        tmp = tmp.replace(/ das /g, ' ');
        // remove ' e '
        tmp = tmp.replace(/ e /g, ' ');

        tmp = tmp.replace(/\s+/g, ' ');
        tmp = tmp.replace(/[^a-z0-9 ]/g, '');
        // remove left zero
        tmp = tmp.replace(/^0+/, '');

        return tmp;
    };

    return normalizeString(str1) === normalizeString(str2);
}
