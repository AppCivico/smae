import { SplitString } from './SplitString';
describe('splitStringByLength', () => {
    it('funcionar', () => {
        const inputString = 'This is a simple example to test the splitStringByLength function in TypeScript.';
        const expectedResult = `This is a simple
example to test the
splitStringByLength
function in
TypeScript.`;

        expect(SplitString.splitString(inputString, 20)).toBe(expectedResult);
    });
});
