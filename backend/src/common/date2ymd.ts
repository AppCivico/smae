export class Date2YMD {
    static fromUTC(d: Date) {
        const str = d.toUTCString();
        return str.substring(0, 12)
    }
}
