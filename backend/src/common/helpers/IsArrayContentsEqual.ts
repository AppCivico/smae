export function IsArrayContentsEqual<T extends string | number | bigint>(
    arr1: T[] | undefined,
    arr2: T[] | undefined
): boolean {
    // If both are undefined, they are equal
    if (arr1 === undefined && arr2 === undefined) {
        return true;
    }

    // If only one is undefined, they are not equal
    if (arr1 === undefined || arr2 === undefined) {
        return false;
    }

    if (arr1.length !== arr2.length) {
        return false;
    }

    const sortedArr1 = [...arr1].sort().map((item) => item.toString());
    const sortedArr2 = [...arr2].sort().map((item) => item.toString());

    return sortedArr1.join(',') === sortedArr2.join(',');
}

export function IsArrayContentsChanged<T extends string | number | bigint>(left: T[] | undefined, right: T[]): boolean {
    // If left is undefined, assume no change
    if (left === undefined) {
        return false;
    }

    return !IsArrayContentsEqual(left, right);
}
