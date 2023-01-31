import { DateTime } from 'luxon';
export type DateYMD = string;

export class Date2YMD {
    static toString(d: Date): DateYMD {
        if (!(d instanceof Date)) throw 'called toString on non-date object';
        if (!d == null) throw 'called DateYMD.toString on null value';
        if (!d) throw 'called DateYMD.toString on undefined value';

        const str = d.toISOString();
        return str.substring(0, 10);
    }

    static toStringOrNull(d: Date | null): DateYMD | null {
        if (d === null) return null;
        return Date2YMD.toString(d);
    }

    static fromString(data: string) {
        const year = Number(data.substring(0, 4));
        const month = Number(data.substring(5, 7));
        const day = Number(data.substring(8, 10));
        if (isNaN(year) || isNaN(month) || isNaN(day)) throw `Invalid Date: ${data}`;

        try {
            const year = +data.substring(0, 4);
            const month = +data.substring(5, 7);
            const day = +data.substring(8, 10);
            return new Date(Date.UTC(year, month - 1, day));
        } catch (error) {
            throw `Data inválida: ${data}`;
        }
    }

    // converte uma data, considerando SP (-0300) para date-time UTC
    static tzSp2UTC(data: string | Date): string {
        const str = typeof data == 'string' ? data : Date2YMD.toString(data);
        return DateTime.fromISO(str, { zone: 'America/Sao_Paulo' }).setZone('UTC').toISO();
    }

    static incDaysFromISO(data: Date, days: number): Date {
        const str = typeof data == 'string' ? data : Date2YMD.toString(data);

        return DateTime.fromISO(str).plus({ days: days }).toJSDate();
    }
}
