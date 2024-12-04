import { describe, it, expect } from 'vitest';
import dateToDate, {
  dateToYear,
  dateToMonth,
  dateToDay,
  dateToMonthYear,
  localizarData,
  localizarDataHorario,
  dateToShortDate,
} from './dateToDate';

describe('dateToDate Utilities', () => {
  describe('dateToDate', () => {
    it('deve retornar "Invalid Date" para entradas inválidas', () => {
      expect(dateToDate(null)).toBe('Invalid Date');
      expect(dateToDate(undefined)).toBe('Invalid Date');
      expect(dateToDate('')).toBe('Invalid Date');
      expect(dateToDate('invalid')).toBe('Invalid Date');
      expect(dateToDate({})).toBe('Invalid Date');
      expect(dateToDate(true)).toBe('Invalid Date');
      expect(dateToDate(false)).toBe('Invalid Date');
    });

    it('deve retornar uma data formatada corretamente', () => {
      expect(dateToDate('2023-11-29')).toBe('29/11/2023');
      expect(dateToDate(new Date('2023-11-29'))).toBe('29/11/2023');
      expect(dateToDate(1701513600000)).toBe('02/12/2023');
    });
  });

  describe('dateToYear', () => {
    it('deve formatar uma data corretamente para ano', () => {
      expect(dateToYear('2023-11-29')).toBe('2023');
      expect(dateToYear(new Date('2023-11-29'))).toBe('2023');
      expect(dateToYear(1701513600000)).toBe('2023');
    });
  });

  describe('dateToMonth', () => {
    it('deve formatar uma data corretamente para mês', () => {
      expect(dateToMonth('2023-11-29')).toBe('11');
      expect(dateToMonth(new Date('2023-11-29'))).toBe('11');
      expect(dateToMonth(1701513600000)).toBe('12');
    });
  });

  describe('dateToDay', () => {
    it('deve formatar uma data corretamente para dia', () => {
      expect(dateToDay('2023-11-29')).toBe('29');
      expect(dateToDay(new Date('2023-11-29'))).toBe('29');
      expect(dateToDay(1701513600000)).toBe('2');
    });
  });

  describe('dateToMonthYear', () => {
    it('deve formatar uma data para "MM/YYYY"', () => {
      expect(dateToMonthYear('2023-11-29')).toBe('11/2023');
      expect(dateToMonthYear(new Date('2023-11-29'))).toBe('11/2023');
      expect(dateToMonthYear(1701513600000)).toBe('12/2023');
    });
  });

  describe('localizarData', () => {
    it('deve localizar a data no formato "dd/MM/yyyy"', () => {
      expect(localizarData('2023-11-29T00:00:00Z')).toBe('28/11/2023');
      expect(localizarData('2023-12-02T00:00:00Z')).toBe('01/12/2023');
      expect(localizarData('2023-12-02T15:00:00-03:00')).toBe('02/12/2023');
    });

    it('deve lidar com timestamps corretamente', () => {
      expect(localizarData(1701513600000)).toBe('02/12/2023');
    });

    it('deve lidar com instâncias de Date', () => {
      expect(localizarData(new Date('2023-12-02T12:00:00Z'))).toBe('02/12/2023');
    });

    it('deve retornar o mesmo dia para entradas no mesmo fuso horário', () => {
      expect(localizarData(new Date('2023-12-02T12:00:00-03:00'))).toBe('02/12/2023');
    });
  });

  describe('localizarDataHorario', () => {
    it('deve localizar a data e horário no formato "dd/MM/yyyy, HH:mm"', () => {
      expect(localizarDataHorario('2023-11-29T15:00:00Z')).toBe('29/11/2023, 12:00');
      expect(localizarDataHorario('2023-12-02T15:00:00-03:00')).toBe('02/12/2023, 15:00');
      expect(localizarDataHorario(new Date('2023-12-02T12:00:00Z'))).toBe('02/12/2023, 09:00');
    });

    it('deve retornar a hora correta para fuso horário configurado', () => {
      expect(localizarDataHorario(new Date('2023-12-02T03:00:00-03:00'))).toBe('02/12/2023, 03:00');
    });
  });

  describe('dateToShortDate', () => {
    it('deve formatar a data como "DD/MM/YYYY"', () => {
      expect(dateToShortDate('2023-11-29T00:00:00Z')).toBe('28/11/2023');
      expect(dateToShortDate('2023-12-02T00:00:00Z')).toBe('01/12/2023');
      expect(dateToShortDate('2023-12-02T15:00:00-03:00')).toBe('02/12/2023');
      expect(dateToShortDate(1701513600000)).toBe('02/12/2023');
      expect(dateToShortDate(new Date('2023-12-02T12:00:00Z'))).toBe('02/12/2023');
    });
  });
});
