export function CrontabIsEnabled(name: string): boolean {
    const str = ',' + (process.env.DISABLED_CRONTABS || '') + ',';
    return !(str.indexOf(`,${name},`) >= 0);
}
