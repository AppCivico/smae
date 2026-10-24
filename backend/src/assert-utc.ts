// Importar antes de qualquer outro módulo: DateTransform e new Date(y, m, d) dependem do fuso do processo.
const offsets = [new Date(2000, 0, 1), new Date(2000, 6, 1)].map((d) => d.getTimezoneOffset());
if (offsets.some((o) => o !== 0)) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    throw new Error(`Processo precisa rodar em UTC (TZ=${process.env.TZ ?? '<unset>'}, resolvido ${tz}). Rode com TZ=UTC.`);
}
