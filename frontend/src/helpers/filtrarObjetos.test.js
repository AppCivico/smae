import { expect, test } from 'vitest';
import filtrarObjetos from './filtrarObjetos';

const testData = [
  {
    name: 'Hank', age: 29, isActive: true, hobbies: ['reading', 'gaming'],
  },
  {
    name: 'Ivy', age: 31, isActive: false, address: { city: 'New York', zip: '10001' },
  },
  {
    name: 'Jack', age: 27, isActive: true, scores: [85, 90, 78],
  },
  {
    name: 'Karen', age: 26, isActive: false, contact: { email: 'karen@example.com', phone: '123-456-7890' },
  },
  {
    name: 'João Marçal', age: 24, isActive: true, bio: 'Loves coding & coffee!',
  },
];

test.each([
  { list: testData, searchTerm: 'York new', expected: [testData[1]] },

  { list: testData, searchTerm: 8, expected: [] },
  { list: testData, searchTerm: '8', expected: [testData[2], testData[3]] },

  { list: testData, searchTerm: 85, expected: [testData[2]] },

  { list: testData, searchTerm: '@', expected: [testData[3]] },

  { list: testData, searchTerm: true, expected: [testData[0], testData[2], testData[4]] },
  { list: testData, searchTerm: 'true', expected: [] },

  { list: testData, searchTerm: '', expected: testData },
  { list: testData, searchTerm: 'marcal', expected: [testData[4]] },
])('filter($list, $searchTerm) -> $expected', ({ list, searchTerm, expected }) => {
  expect(filtrarObjetos(list, searchTerm)).toStrictEqual(expected);
});
