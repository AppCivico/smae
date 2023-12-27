export function CrontabIsEnabled(name: string): boolean {
    const str = ',' + (process.env.ENABLED_CRONTABS || '') + ',';
    return str.indexOf(`,${name},`) >= 0;
}
