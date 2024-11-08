import { expect, test } from 'vitest';
import truncate from './truncate';

test.each([
  {
    str: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    maxLen: 50,
    suffix: '+++',
    separator: ',',

    expected: 'Lorem ipsum dolor sit amet+++',
  },
  {
    str: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    maxLen: 16,
    expected: 'Lorem ipsum...',
  },
  {
    str: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    maxLen: 4,
    expected: 'Lore...',
  },
  {
    str: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    maxLen: 16,
    separator: '.',
    expected: 'Lorem ipsum dolo...',
  },
])('truncate($str, $maxLen, $suffix, $separator) -> $expected', ({
  str, maxLen, suffix, separator, expected,
}) => {
  expect(truncate(str, maxLen, suffix, separator)).toBe(expected);
});
