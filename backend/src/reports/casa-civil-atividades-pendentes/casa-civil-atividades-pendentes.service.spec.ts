import { jest } from '@jest/globals';

import { CasaCivilAtividadesPendentesService } from './casa-civil-atividades-pendentes.service';

// Mock modules used inside the service
// 1) Date2YMD helper used to normalize incoming dates
jest.mock('../../common/date2ymd', () => ({
  Date2YMD: {
    toString: jest.fn((d: any) => String(d)),
  },
}));

// 2) CSV writer: we will capture options and rows passed for assertions
const writeCsvToFileMock = jest.fn().mockResolvedValue(undefined);
jest.mock('src/common/helpers/CsvWriter', () => ({
  WriteCsvToFile: (...args: any[]) => writeCsvToFileMock(...args),
}));

// 3) Default CSV utils: export sentinel values so we can assert they are wired correctly
jest.mock('../utils/utils.service', () => ({
  DefaultCsvOptions: { sentinel: 'default-csv-opts' },
  DefaultTransforms: ['transform-1', 'transform-2'],
}));

// 4) Prisma namespace: we mock Prisma.sql tag so we can build traceable SQL text pieces;
//    NOTE: We do NOT mock PrismaService class here; we control prisma.$queryRaw in tests per-instance.
jest.mock('@prisma/client', () => {
  function exprToText(expr: any): string {
    if (expr && typeof expr === 'object' && 'text' in expr) {
      return String((expr as any).text);
    }
    if (Array.isArray(expr)) {
      return `ARRAY[${expr.join(', ')}]`;
    }
    return String(expr);
  }
  const sql = (strings: TemplateStringsArray, ...exprs: any[]) => {
    let text = '';
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < exprs.length) {
        text += exprToText(exprs[i]);
      }
    }
    return { text };
  };
  return { Prisma: { sql } };
});

import { Date2YMD } from '../../common/date2ymd';

type MockedPrisma = {
  $queryRaw: jest.Mock<any, any>;
};

describe('CasaCivilAtividadesPendentesService', () => {
  let prisma: MockedPrisma;
  let service: CasaCivilAtividadesPendentesService;

  beforeEach(() => {
    jest.clearAllMocks();

    // $queryRaw is used as a tagged template function in the service, so we mock it as such
    prisma = {
      $queryRaw: jest.fn((strings: TemplateStringsArray, ...exprs: any[]) => {
        // By default return one example row; tests may override implementation
        return Promise.resolve([
          {
            identificador: 'ID-001',
            parlamentares: 'Alice, Bob',
            valor: 123.45,
            atividade: 'Atividade X',
            inicio_planejado: '2024-01-02',
            termino_planejado: '2024-03-04',
            inicio_real: '2024-02-01',
            orgao_responsavel: 'ORG',
            responsavel_atividade: 'RESP',
          },
        ]);
      }),
    } as unknown as MockedPrisma;

    service = new CasaCivilAtividadesPendentesService(prisma as any);
  });

  describe('asJSON', () => {
    it('returns rows from prisma.$queryRaw without filters', async () => {
      const rows = await service.asJSON({} as any);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(Array.isArray(rows)).toBe(true);
      expect(rows[0]).toHaveProperty('identificador', 'ID-001');
      // No date normalization should be invoked when dates are not present
      expect(Date2YMD.toString).not.toHaveBeenCalled();
    });

    it('applies all dynamic filters: tipo_id, data_inicio, data_termino, esfera, orgao_id', async () => {
      // Arrange: have prisma capture the WHERE expression and still return mock rows
      let capturedWhereText = '';
      (prisma.$queryRaw as jest.Mock).mockImplementation(
        (strings: TemplateStringsArray, ...exprs: any[]) => {
          // The service calls: WHERE ${whereConditions}
          // Our Prisma.sql mock builds an object with `.text`, so the WHERE expression is exprs[last].text
          const whereExpr = exprs[exprs.length - 1];
          capturedWhereText = whereExpr && whereExpr.text ? String(whereExpr.text) : '';
          return Promise.resolve([]);
        },
      );

      // Mock Date2YMD normalization results to fixed outputs we can assert on
      (Date2YMD.toString as jest.Mock).mockImplementation((d: any) => {
        if (d === '2022-01-02') return '2022-01-02';
        if (d === '2022-05-06') return '2022-05-06';
        return String(d);
      });

      const params = {
        tipo_id: [1, 2],
        data_inicio: '2022-01-02',
        data_termino: '2022-05-06',
        esfera: 'MUNICIPAL',
        orgao_id: [10, 20],
      } as any;

      const rows = await service.asJSON(params);

      // Assert prisma was invoked and returned empty per our override
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(rows).toEqual([]);

      // Date normalization called with provided dates
      expect(Date2YMD.toString).toHaveBeenCalledTimes(2);
      expect(Date2YMD.toString).toHaveBeenCalledWith('2022-01-02');
      expect(Date2YMD.toString).toHaveBeenCalledWith('2022-05-06');

      // WHERE clause text should contain markers for each applied filter
      // (We check substrings rather than full SQL for robustness)
      expect(capturedWhereText).toContain('tt.id = ANY');           // tipo_id
      expect(capturedWhereText).toContain('tf.inicio_planejado >'); // data_inicio
      expect(capturedWhereText).toContain('tf.termino_planejado <'); // data_termino
      expect(capturedWhereText).toContain('t.esfera =');            // esfera
      expect(capturedWhereText).toContain('tf.orgao_id = ANY');     // orgao_id
    });

    it('does not apply array-based filters when arrays are empty', async () => {
      let capturedWhereText = '';
      (prisma.$queryRaw as jest.Mock).mockImplementation(
        (strings: TemplateStringsArray, ...exprs: any[]) => {
          const whereExpr = exprs[exprs.length - 1];
          capturedWhereText = whereExpr && whereExpr.text ? String(whereExpr.text) : '';
          return Promise.resolve([]);
        },
      );

      await service.asJSON({ tipo_id: [], orgao_id: [] } as any);

      // Ensure we didn't append ANY(...) conditions for empty arrays
      expect(capturedWhereText).not.toContain('tt.id = ANY');
      expect(capturedWhereText).not.toContain('tf.orgao_id = ANY');
    });
  });

  describe('toFileOutput', () => {
    const ORIGINAL_NUMBER_FORMAT = Intl.NumberFormat;

    beforeEach(() => {
      // Reset the default fallback implementation for prisma.$queryRaw (returns 1 row)
      (prisma.$queryRaw as jest.Mock).mockImplementation(
        (strings: TemplateStringsArray, ...exprs: any[]) => {
          return Promise.resolve([
            {
              identificador: 'ID-001',
              parlamentares: 'Alice, Bob',
              valor: 9876.5,
              atividade: 'Atividade X',
              inicio_planejado: '2024-01-02',
              termino_planejado: '2024-03-04',
              inicio_real: '2024-02-01',
              orgao_responsavel: 'ORG',
              responsavel_atividade: 'RESP',
            },
          ]);
        },
      );
    });

    afterEach(() => {
      // Restore any global stubs that may affect other tests
      jest.spyOn(Intl, 'NumberFormat').mockRestore();
      // toLocaleDateString restore
      if ((Date.prototype.toLocaleDateString as any).mockRestore) {
        (Date.prototype.toLocaleDateString as any).mockRestore();
      }
      // Restore in case a test replaced Intl.NumberFormat constructor entirely
      (Intl as any).NumberFormat = ORIGINAL_NUMBER_FORMAT;
    });

    it('writes CSV and returns file output when there are rows', async () => {
      // Arrange: stub Intl.NumberFormat and Date.prototype.toLocaleDateString to deterministic values
      jest
        .spyOn(Intl, 'NumberFormat')
        .mockImplementation(
          () =>
            ({
              format: () => 'BRL_FORMATTED',
            } as any),
        );

      jest
        .spyOn(Date.prototype, 'toLocaleDateString')
        .mockImplementation(() => '31/12/2024');

      const progress = jest.fn().mockResolvedValue(undefined);
      const resumoSaida = jest.fn().mockResolvedValue(undefined);
      const tmpFile = {
        path: '/tmp/atividades-pendentes.csv',
        stream: { write: jest.fn(), end: jest.fn() },
      };
      const getTmpFile = jest.fn().mockReturnValue(tmpFile);

      const ctx = { progress, getTmpFile, resumoSaida } as any;

      // Act
      const out = await service.toFileOutput({} as any, ctx);

      // Assert: progress called, temporary file requested with specific name
      expect(progress).toHaveBeenCalledWith(40);
      expect(getTmpFile).toHaveBeenCalledWith('atividades-pendentes.csv');

      // Assert: WriteCsvToFile called with rows, tmp stream, and configured options
      expect(writeCsvToFileMock).toHaveBeenCalledTimes(1);
      const [rowsArg, streamArg, optsArg] = writeCsvToFileMock.mock.calls[0];
      expect(Array.isArray(rowsArg)).toBe(true);
      expect(streamArg).toBe(tmpFile.stream);
      // Options should carry our sentinel values from the mocked DefaultCsvOptions/DefaultTransforms
      expect(optsArg.csvOptions).toEqual({ sentinel: 'default-csv-opts' });
      expect(optsArg.transforms).toEqual(['transform-1', 'transform-2']);

      // Fields: validate labels and formatters
      expect(Array.isArray(optsArg.fields)).toBe(true);
      expect(optsArg.fields.map((f: any) => f.label)).toEqual([
        'Identificador',
        'Parlamentares',
        'Valor do Repasse',
        'Atividade',
        'Previsão de Início',
        'Previsão de Término',
        'Início Real',
        'Orgão Responsável',
        'Responsável pela Atividade',
      ]);

      const sampleRow = {
        identificador: 'ID-9',
        parlamentares: 'P1',
        valor: 100,
        atividade: 'A',
        inicio_planejado: '2024-01-01',
        termino_planejado: '2024-12-31',
        inicio_real: '2024-06-30',
        orgao_responsavel: 'ORG',
        responsavel_atividade: 'RESP',
      };

      // Currency field should use Intl.NumberFormat stub
      const currencyField = optsArg.fields[2];
      expect(currencyField.label).toBe('Valor do Repasse');
      expect(currencyField.value({ valor: 0 })).toBe('BRL_FORMATTED');
      expect(currencyField.value({ valor: null })).toBe('');

      // Date fields should return ="<date>"
      const inicioField = optsArg.fields[4];
      const terminoField = optsArg.fields[5];
      const inicioRealField = optsArg.fields[6];
      expect(inicioField.value(sampleRow)).toBe('="31/12/2024"');
      expect(terminoField.value(sampleRow)).toBe('="31/12/2024"');
      expect(inicioRealField.value(sampleRow)).toBe('="31/12/2024"');

      // When row has null dates, fields should return empty string
      const nullDatesRow = { inicio_planejado: null, termino_planejado: null, inicio_real: null };
      expect(inicioField.value(nullDatesRow)).toBe('');
      expect(terminoField.value(nullDatesRow)).toBe('');
      expect(inicioRealField.value(nullDatesRow)).toBe('');

      // Output structure
      expect(out).toEqual([
        {
          name: 'atividades-pendentes.csv',
          localFile: '/tmp/atividades-pendentes.csv',
        },
      ]);

      // resumoSaida is called with descriptive title and count
      expect(resumoSaida).toHaveBeenCalledWith('Atividades Pendentes', rowsArg.length);
    });

    it('returns empty output and does not write CSV when there are no rows', async () => {
      // Arrange: force asJSON via prisma to return empty array
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);

      const progress = jest.fn().mockResolvedValue(undefined);
      const resumoSaida = jest.fn().mockResolvedValue(undefined);
      const getTmpFile = jest.fn();

      const ctx = { progress, getTmpFile, resumoSaida } as any;

      // Act
      const out = await service.toFileOutput({} as any, ctx);

      // Assert
      expect(progress).toHaveBeenCalledWith(40);
      expect(writeCsvToFileMock).not.toHaveBeenCalled();
      expect(getTmpFile).not.toHaveBeenCalled();
      expect(resumoSaida).not.toHaveBeenCalled();
      expect(out).toEqual([]);
    });

    it('propagates WriteCsvToFile errors and still attempts progress call beforehand', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
        {
          identificador: 'ID-ERR',
          parlamentares: '',
          valor: null,
          atividade: '',
          inicio_planejado: null,
          termino_planejado: null,
          inicio_real: null,
          orgao_responsavel: '',
          responsavel_atividade: '',
        },
      ]);

      const progress = jest.fn().mockResolvedValue(undefined);
      const resumoSaida = jest.fn().mockResolvedValue(undefined);
      const getTmpFile = jest.fn().mockReturnValue({
        path: '/tmp/a.csv',
        stream: {},
      });

      // Force the writer to reject
      writeCsvToFileMock.mockRejectedValueOnce(new Error('disk full'));

      const ctx = { progress, getTmpFile, resumoSaida } as any;

      await expect(service.toFileOutput({} as any, ctx)).rejects.toThrow('disk full');
      expect(progress).toHaveBeenCalledWith(40);
      expect(getTmpFile).toHaveBeenCalledWith('atividades-pendentes.csv');
      // resumoSaida should not be called since write failed
      expect(resumoSaida).not.toHaveBeenCalled();
    });
  });
});