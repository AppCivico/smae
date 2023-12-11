export class SplitString {
    static splitString(inputString: string, length: number): string {
        const splitArray: string[] = [];
        let splitIndex = 0;

        while (splitIndex < inputString.length) {
            let cutIndex = splitIndex + length;
            if (cutIndex < inputString.length) {
                const spaceIndex: number = inputString.lastIndexOf(' ', cutIndex);
                if (spaceIndex > splitIndex) {
                    cutIndex = spaceIndex;
                }
            }
            splitArray.push(inputString.slice(splitIndex, cutIndex));
            splitIndex = cutIndex + 1;
        }
        return splitArray.join('\n');
    }
}
