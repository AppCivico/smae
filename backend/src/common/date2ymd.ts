import { DateTime } from "luxon";
export type DateYMD = string;

export class Date2YMD {
    static toString(d: Date): DateYMD {
        const str = d.toISOString();
        return str.substring(0, 10)
    }

    static toStringOrNull(d: Date | null): DateYMD | null {
        if (d === null) return null;
        return Date2YMD.toString(d);
    }

    static fromString(data: string) {
        try {
            const year = +data.substring(0, 4);
            const month = +data.substring(5, 7);
            const day = +data.substring(8, 10);
            return new Date(Date.UTC(year, month - 1, day));
        } catch (error) {
            throw `Data inválida: ${data}`
        }
    }

    // converte uma data, considerando SP (-0300) para date-time UTC
    static tzSp2UTC(data: string | Date): string {
        let str = typeof data == 'string' ? data : Date2YMD.toString(data);
        return DateTime.fromISO(str, { zone: "America/Sao_Paulo" }).setZone('UTC').toISO();
    }


    static incDaysFromISO(data: Date, days: number): Date {
        let str = typeof data == 'string' ? data : Date2YMD.toString(data);

        return DateTime.fromISO(str).plus({ days: days }).toJSDate();
    }

}
