import { describe, expect, it } from 'vitest';
import dateToDate, {
  dateToDay,
  dateToMonth,
  dateToMonthYear,
  dateToShortDate,
  dateToYear,
  hasTimeInDate,
  localizarData,
  localizarDataHorario,
} from './dateToDate';

describe('dateToDate Utilities', () => {
  describe('dateToDate', () => {
    it('deve retornar "Invalid Date" para entradas inválidas', () => {
      expect(dateToDate(null)).toBe('');
      expect(dateToDate(undefined)).toBe('');
      expect(dateToDate('')).toBe('');
      expect(dateToDate('invalid')).toBe('Invalid Date');
      expect(dateToDate({})).toBe('Invalid Date');
      expect(dateToDate(true)).toBe('Invalid Date');
      expect(dateToDate(false)).toBe('Invalid Date');
      expect(dateToDate(1701513600000)).toBe('Invalid Date');
    });

    it('deve retornar uma data formatada corretamente', () => {
      expect(dateToDate('2023-11-29')).toBe('29/11/2023');

      expect(dateToDate('2023-11-29T23:23:43.674Z')).toBe('29/11/2023, 20:23');
    });
  });

  describe('dateToYear', () => {
    it('deve formatar uma data corretamente para ano', () => {
      expect(dateToYear('2023-11-29')).toBe('2023');
      expect(dateToYear(new Date('2023-11-29'))).toBe('2023');
    });
  });

  describe('dateToMonth', () => {
    it('deve formatar uma data corretamente para mês', () => {
      expect(dateToMonth('2023-11-29')).toBe('11');
      expect(dateToMonth(new Date('2023-11-29'))).toBe('11');
      expect(dateToMonth(1701513600000)).toBe('Invalid Date');
    });
  });

  describe('dateToDay', () => {
    it('deve formatar uma data corretamente para dia', () => {
      expect(dateToDay('2023-11-29')).toBe('29');
      expect(dateToDay(1701513600000)).toBe('Invalid Date');
    });
  });

  describe('dateToMonthYear', () => {
    it('deve formatar uma data para "MM/YYYY"', () => {
      expect(dateToMonthYear('2023-11-29')).toBe('11/2023');
      expect(dateToMonthYear(new Date('2023-11-30'))).toBe('11/2023');
      expect(dateToMonthYear(1701513600000)).toBe('Invalid Date');
    });
  });

  describe('localizarData', () => {
    it('deve localizar a data no formato "dd/MM/yyyy"', () => {
      expect(localizarData('2023-11-29T00:00:00Z')).toBe('28/11/2023');
      expect(localizarData('2023-12-02T00:00:00Z')).toBe('01/12/2023');
      expect(localizarData('2023-12-02T15:00:00-03:00')).toBe('02/12/2023');
    });

    it('deve lidar com instâncias de Date', () => {
      expect(localizarData(new Date('2023-12-02T12:00:00Z'))).toBe('02/12/2023');
    });

    it('deve retornar o mesmo dia para entradas no mesmo fuso horário', () => {
      expect(localizarData(new Date('2023-12-02T12:00:00-03:00'))).toBe('02/12/2023');
    });

    it('deve lidar com todas as variações possíveis de data e timezone', () => {
      expect(localizarData('2023-12-02T15:00:00Z')).toBe('02/12/2023');
      expect(localizarData('2023-12-02 15:00:00Z')).toBe('02/12/2023');
      expect(localizarData('2023-12-02T00:00:00Z')).toBe('01/12/2023');
      expect(localizarData('2023-12-02')).toBe('02/12/2023');
      expect(localizarData(new Date('2023-12-02T15:00:00Z'))).toBe('02/12/2023');
      expect(localizarData('2023-12-02T15:00:00-03:00')).toBe('02/12/2023');
      expect(localizarData('12/02/2023')).toBe('02/12/2023');
      expect(localizarData('12/02/2023')).toBe('02/12/2023');
      expect(localizarData('12/02/2023 15:30:00')).toBe('02/12/2023');
    });

    it('deve retornar "Invalid Date" para entradas inválidas', () => {
      expect(localizarData(null)).toBe('');
      expect(localizarData(undefined)).toBe('');
      expect(localizarData('invalid')).toBe('Invalid Date');
      expect(localizarData([])).toBe('Invalid Date');
      expect(localizarData({})).toBe('Invalid Date');
      expect(localizarData(1701513600000)).toBe('Invalid Date');
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
      expect(dateToShortDate(new Date('2023-12-02T12:00:00Z'))).toBe('02/12/2023');
      expect(dateToShortDate(1701513600000)).toBe('Invalid Date');
    });
  });

  describe('hasTimeInDate', () => {
    it('deve retornar true para strings com horário', () => {
      expect(hasTimeInDate('2023-12-02T15:00:00Z')).toBe(true);
      expect(hasTimeInDate('2023-12-02T15:00:00')).toBe(true);
    });

    it('deve retornar false para strings sem horário', () => {
      expect(hasTimeInDate('2023-12-02')).toBe(false);
      expect(hasTimeInDate('boa tarde')).toBe(false);
    });

    it('deve retornar false para strings apenas com horário', () => {
      expect(hasTimeInDate('15:00:00')).toBe(false);
    });

    it('deve retornar true para Date com horário', () => {
      expect(hasTimeInDate(new Date('2023-12-02T15:00:00Z'))).toBe(true);
      expect(hasTimeInDate(new Date('2023-12-02T00:00:00Z'))).toBe(true);
      expect(hasTimeInDate(new Date('2023-12-02T00:00:00'))).toBe(true);
      expect(hasTimeInDate(new Date('2023-12-02 00:00:00'))).toBe(true);
      expect(hasTimeInDate(new Date('2023-12-02'))).toBe(true);
    });

    it('deve retornar false para entradas inválidas', () => {
      expect(hasTimeInDate(null)).toBe(false);
      expect(hasTimeInDate(undefined)).toBe(false);
      expect(hasTimeInDate({})).toBe(false);
      expect(hasTimeInDate([])).toBe(false);
      expect(hasTimeInDate('')).toBe(false);
      expect(hasTimeInDate(23344)).toBe(false);
      expect(hasTimeInDate('teste')).toBe(false);
    });

    it('deve retornar true para strings no formato ISO com horário explícito', () => {
      expect(hasTimeInDate('2023-12-02T00:00:00')).toBe(true);
    });

    it('deve retornar false para instâncias de Date inválidas', () => {
      expect(hasTimeInDate(new Date('tarde'))).toBe(false);
    });

    it('deve retornar false para strings com horário mal formatado', () => {
      expect(hasTimeInDate('2023-12-02 15h30m')).toBe(false);
      expect(hasTimeInDate('2023-12-02T15:00')).toBe(false);
    });

    it('deve retornar false para tipos não suportados', () => {
      expect(hasTimeInDate(() => {})).toBe(false);
      expect(hasTimeInDate(Symbol('test'))).toBe(false);
      expect(hasTimeInDate(BigInt(12345678901234567890n))).toBe(false);
    });
  });
});
