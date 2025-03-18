/**
 * Ensures string values are handled correctly for Prisma operations.
 * Returns the original value if it's a non-empty string or undefined.
 * Returns the default value *defaultValue* for required fields when the value is null
 *
 * @param value The string value that might be null or undefined
 * @param defaultValue Optional default value for required fields
 * @returns string | undefined (never returns null)
 */
export function EnsureString(value: string | null | undefined, defaultValue?: string): string | undefined {
    if (value === null) {
        return defaultValue;
    }
    return value;
}
