export type DateYMD = string;

export class Date2YMD {
    static toString(d: Date): DateYMD {
        const str = d.toISOString();
        return str.substring(0, 10)
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
        let str = typeof data === 'string' ? data : Date2YMD.toString(data);
        return new Date(
            new Date('' + str + 'T00:00:00').toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
        ).toISOString()
    }


    static incUtcDays(data: Date, days: number): Date {
        var incDays = new Date();
        incDays.setUTCDate(incDays.getUTCDate() + days);
        return incDays;
    }

}
