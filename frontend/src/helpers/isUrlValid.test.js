import {
  describe,
  expect,
  it,
} from 'vitest';
import isUrlValid from './isUrlValid.ts';

describe('isValidUrl', () => {
  it('deve reportar URLs inválidas', () => {
    expect(isUrlValid('tcp://smae.com')).toBe(true);
    expect(isUrlValid('invalidURL')).toBe(false);
    expect(isUrlValid('htt//smae.com')).toBe(false);
    expect(isUrlValid('http://smae.com')).toBe(true);
    expect(isUrlValid('https://smae.com')).toBe(true);
    expect(isUrlValid('smae.com')).toBe(false);
    expect(isUrlValid(undefined)).toBe(false);
    expect(isUrlValid(null)).toBe(false);
    expect(isUrlValid(1)).toBe(false);
    expect(isUrlValid(NaN)).toBe(false);
  });

  it('deve exigir protocolo `http` se solicitado', () => {
    expect(isUrlValid('tcp://smae.com', true)).toBe(false);
    expect(isUrlValid('invalidURL', true)).toBe(false);
    expect(isUrlValid('htt//smae.com', true)).toBe(false);
    expect(isUrlValid('http://smae.com', true)).toBe(true);
    expect(isUrlValid('https://smae.com', true)).toBe(true);
    expect(isUrlValid('smae.com', true)).toBe(false);
    expect(isUrlValid(undefined, true)).toBe(false);
    expect(isUrlValid(null, true)).toBe(false);
    expect(isUrlValid(1, true)).toBe(false);
    expect(isUrlValid(NaN, true)).toBe(false);
  });

  it('deve assumir protocolo `http` se solicitado', () => {
    expect(isUrlValid('tcp://smae.com', true, true)).toBe(false);
    expect(isUrlValid('invalidURL', true, true)).toBe(true);
    expect(isUrlValid('htt//smae.com', true, true)).toBe(true);
    expect(isUrlValid('http://smae.com', true, true)).toBe(true);
    expect(isUrlValid('https://smae.com', true, true)).toBe(true);
    expect(isUrlValid('smae.com', true, true)).toBe(true);
    expect(isUrlValid(undefined, true, true)).toBe(false);
    expect(isUrlValid(null, true, true)).toBe(false);
    expect(isUrlValid(1, true, true)).toBe(false);
    expect(isUrlValid(NaN, true, true)).toBe(false);
  });
});
