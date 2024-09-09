export function CrontabIsEnabled(name: string): boolean {
    const str = ',' + (process.env.DISABLED_CRONTABS || '') + ',';
    if (str == 'all') {
        return false;
    }
    return !(str.indexOf(`,${name},`) >= 0);
}
