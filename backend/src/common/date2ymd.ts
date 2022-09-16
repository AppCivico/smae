export class Date2YMD {
    static toString(d: Date) {
        const str = d.toISOString();
        return str.substring(0, 10)
    }
}
