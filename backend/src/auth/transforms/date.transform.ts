import { TransformFnParams } from 'class-transformer';

export function DateTransform(a: TransformFnParams): Date | undefined | null {
    if (a.value === '' || a.value === null) return a.value;
    if (a.value instanceof Date) return a.value;

    const dateStr = a.value.substring(0, 10);
    const dateParts = dateStr.split('-');
    if (dateParts.length !== 3) return NaN as any as Date;

    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return NaN as any as Date; // invalid date parts

    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return NaN as any as Date; // invalid date (e.g., Feb 31)
    }

    return date;
}

export function DateTransformDMY(a: TransformFnParams): Date | undefined | null {
    if (a.value === '' || a.value === null) return a.value;
    if (a.value instanceof Date) return a.value;

    const dateStr = a.value;
    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3) return NaN as any as Date;

    const year = parseInt(dateParts[2], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[0], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return NaN as any as Date; // invalid date parts

    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return NaN as any as Date; // invalid date (e.g., Feb 31)
    }

    return date;
}
