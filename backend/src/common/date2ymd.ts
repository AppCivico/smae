export type DateYMD = string;

export class Date2YMD {
    static toString(d: Date): DateYMD {
        const str = d.toISOString();
        return str.substring(0, 10)
    }
}
