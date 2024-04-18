export function TextToTSQuery(input: string): string {
    input = input.replace(/[,]/g, ' ');
    input = input.replace(/\s+/g, ' ');
    let words = input.trim().split(' ');

    // Replace Portuguese operators with their TSQuery equivalents
    words = words.map((word) => {
        if (word.toLowerCase() === 'e') {
            return '&';
        } else if (word.toLowerCase() === 'ou') {
            return '|';
        } else {
            return `${word}:*`;
        }
    });

    // Join the words into a TSQuery string
    const formattedWords = words.join(' ');

    return formattedWords;
}
