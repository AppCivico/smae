import { DateTime } from 'luxon';
export type DateYMD = string;

// dessa forma pra mudar, mas não depois de iniciado a instancia
// ainda há hardcoded dentro das funções do banco
// então não é suportado 100%
export const SYSTEM_TIMEZONE = 'America/Sao_Paulo';

export class Date2YMD {
    static toString(d: Date): DateYMD {
        if (!(d instanceof Date)) throw 'called toString on non-date object';
        if (d == null) throw 'called DateYMD.toString on null value';
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
        const tryConvert = DateTime.fromISO(str, { zone: SYSTEM_TIMEZONE }).setZone('UTC').toISO();

        if (tryConvert == null) throw new Error(`invalid date "${data}", cannot convert parse.`);
        return tryConvert;
    }

    static incDaysFromISO(data: Date, days: number): Date {
        const str = typeof data == 'string' ? data : Date2YMD.toString(data);

        return DateTime.fromISO(str).plus({ days: days }).toJSDate();
    }

    // usado quando a saida é um outro humano diretamente
    // não passar DateTime * VAI VOLTAR 1 DIA se for ainda -03 em SP
    static dbDateToDMY(data: Date | null): string {
        if (!data) return '';
        const dt = DateTime.fromJSDate(data, { zone: 'UTC' });
        return dt.day.toString().padStart(2, '0') + '/' + dt.month.toString().padStart(2, '0') + '/' + dt.year;
    }

    static ymdToDMY(data: string | null): string {
        if (!data) return '-';
        const parts = data.split('-');
        if (parts.length != 3) return `Invalid date: ${data}`;
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    static FromISOOrNull(data: string | null): DateTime | null {
        if (!data) return null;

        // WHY??? Tem alguem mentindo no Tarefa.service... sem tempo no momento para debuggar isso, resolvendo na marreta
        if ((data as any) instanceof Date) return DateTime.fromJSDate(data as any, { zone: 'UTC' });

        return DateTime.fromISO(data, { zone: 'UTC' });
    }
}
