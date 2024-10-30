import { TransformFnParams } from 'class-transformer';
import { DateTime } from 'luxon';
import { SYSTEM_TIMEZONE } from '../../common/date2ymd';

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

    const dateTimeStr = a.value as string;
    const [dateStr, timeStr] = dateTimeStr.split(' ');
    const [day, month, year] = dateStr.split('/').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return NaN as any as Date; // invalid date parts

    let hours = 0,
        minutes = 0,
        seconds = 0;
    if (timeStr) {
        const timeParts = timeStr.split(':').map(Number);
        [hours, minutes, seconds] = timeParts;

        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return NaN as any as Date; // invalid time parts
    }

    const dt = DateTime.fromObject(
        { year, month, day, hour: hours, minute: minutes, second: seconds },
        { zone: timeStr ? SYSTEM_TIMEZONE : 'UTC' }
    );

    if (!dt.isValid) {
        return NaN as any as Date; // invalid date or time
    }

    return dt.toUTC().toJSDate();
}
