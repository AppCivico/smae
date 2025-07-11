export function IsCrontabEnabled(name: string): boolean {
    const str = ',' + (process.env.DISABLED_CRONTABS || '') + ',';
    if (str == ',all,') {
        return false;
    }
    return !(str.indexOf(`,${name},`) >= 0);
}

export function IsCrontabDisabled(name: string): boolean {
    return !IsCrontabEnabled(name);
}
