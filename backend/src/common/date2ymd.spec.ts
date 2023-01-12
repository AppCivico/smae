import { Date2YMD } from "./date2ymd";

describe('date2ymd', () => {
    describe('date from string to date', () => {
        it('should parse date', async () => {
            expect(Date2YMD.fromString('2022-01-01')).toMatchObject(new Date('2022-01-01'));
        });

        it('should fail on non-date', async () => {
            expect(() => Date2YMD.fromString('2022 01 TT')).toThrow(/^Invalid Date:.+/);
        });
    });

    describe('date to text', () => {
        it('should convert', async () => {
            expect(Date2YMD.toString(new Date('2022-01-01'))).toBe('2022-01-01');
        });
    });
});
