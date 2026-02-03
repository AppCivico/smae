/**
 * Compute diff between two objects, returning only changed fields
 * Returns null if no changes detected
 */
export function ObjectDiff(previous: Record<string, any>, current: Record<string, any>): Record<string, any> | null {
    const diff: Record<string, any> = {};
    let hasChanges = false;

    // Check for changed or added fields
    for (const key of Object.keys(current)) {
        const prevValue = previous[key];
        const currValue = current[key];

        // Compare values (handle null/undefined equivalence)
        const prevJson = prevValue !== undefined ? JSON.stringify(prevValue) : undefined;
        const currJson = currValue !== undefined ? JSON.stringify(currValue) : undefined;

        if (prevJson !== currJson) {
            diff[key] = {
                from: prevValue,
                to: currValue,
            };
            hasChanges = true;
        }
    }

    // Check for removed fields
    for (const key of Object.keys(previous)) {
        if (!(key in current)) {
            diff[key] = {
                from: previous[key],
                to: undefined,
            };
            hasChanges = true;
        }
    }

    return hasChanges ? diff : null;
}
