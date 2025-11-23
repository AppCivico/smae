import { Writable } from 'stream';

// Note on testing framework: These tests are written for Jest with TypeScript.
// If your project uses a different framework (e.g., Vitest or Mocha/Chai), replace
// the imports (jest.mock/expect/describe/it) and assertions accordingly.

// We import from the given file path in the PR context.
// If the implementation actually resides in a different file (e.g., CsvWriter.ts),
// update this import accordingly.
import { WriteCsvToFile, WriteCsvToBuffer } from '../CsvWriter.spec';

// Mock @json2csv/plainjs Parser to focus on our stream and option-handling logic.
const mockParse = jest.fn<string, any[]>();
const ParserCtor = jest.fn().mockImplementation((_opts: any) => {
  return { parse: mockParse };
});

jest.mock('@json2csv/plainjs', () => ({
  Parser: ParserCtor,
}));

type Sample = { a: number; b: string };

describe('CsvWriter helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WriteCsvToBuffer', () => {
    it('should return a Buffer with the parser output and pass options to Parser', () => {
      const data: Sample[] = [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
      ];
      mockParse.mockReturnValueOnce('header\na,b\n1,x\n2,y');

      const options = {
        csvOptions: { excelStrings: true, withBOM: true, eol: '\r\n' },
        transforms: [{ some: 'transform' }],
        fields: ['a', 'b'],
      } as any;

      const buf = WriteCsvToBuffer(data, options);
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.toString('utf8')).toBe('header\na,b\n1,x\n2,y');

      // Parser should be constructed once with header: true and provided options
      expect(ParserCtor).toHaveBeenCalledTimes(1);
      const ctorArg = ParserCtor.mock.calls[0][0];
      expect(ctorArg).toMatchObject({
        header: true,
        excelStrings: true,
        withBOM: true,
        eol: '\r\n',
        transforms: options.transforms,
        fields: options.fields,
      });
    });

    it('should handle empty data gracefully', () => {
      mockParse.mockReturnValueOnce('');
      const buf = WriteCsvToBuffer([], { csvOptions: { eol: '\n' } });
      expect(buf.toString('utf8')).toBe('');
      expect(ParserCtor).toHaveBeenCalledTimes(1);
      expect(ParserCtor.mock.calls[0][0].header).toBe(true);
    });
  });

  describe('WriteCsvToFile', () => {
    function makeWritableCollector() {
      const chunks: string[] = [];
      const writable = new Writable({
        write(chunk, _enc, cb) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
          cb();
        },
      });
      return { writable, chunks };
    }

    it('should write header for first record only, then rows without header, and resolve on finish', async () => {
      const { writable, chunks } = makeWritableCollector();

      // Simulate parser output:
      // first call (header: true) => includes header+row (without trailing eol; our code appends it)
      // second call (header: false) => row only
      mockParse
        .mockReturnValueOnce('h1,h2\n1,x')
        .mockReturnValueOnce('2,y');

      const data: Sample[] = [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
      ];

      const options = {
        csvOptions: { eol: '\n' },
        transforms: undefined,
        fields: undefined,
      } as any;

      await expect(WriteCsvToFile(data, writable, options)).resolves.toBeUndefined();

      // Verify output content eol appended by our transform
      expect(chunks.join('')).toBe('h1,h2\n1,x\n2,y\n');

      // Verify Parser constructed twice with header flags: true then false
      expect(ParserCtor).toHaveBeenCalledTimes(2);
      expect(ParserCtor.mock.calls[0][0]).toEqual(
        expect.objectContaining({ header: true, eol: '\n' })
      );
      expect(ParserCtor.mock.calls[1][0]).toEqual(
        expect.objectContaining({ header: false, eol: '\n' })
      );
    });

    it('should respect custom EOL in csvOptions', async () => {
      const { writable, chunks } = makeWritableCollector();
      mockParse
        .mockReturnValueOnce('H\nrow1') // header + first row
        .mockReturnValueOnce('row2');

      const data: Sample[] = [{ a: 1, b: 'x' }, { a: 2, b: 'y' }];
      const options = { csvOptions: { eol: '\r\n' } } as any;

      await WriteCsvToFile(data, writable, options);
      expect(chunks.join('')).toBe('H\nrow1\r\nrow2\r\n');

      expect(ParserCtor).toHaveBeenCalledTimes(2);
      expect(ParserCtor.mock.calls[0][0]).toEqual(expect.objectContaining({ header: true, eol: '\r\n' }));
      expect(ParserCtor.mock.calls[1][0]).toEqual(expect.objectContaining({ header: false, eol: '\r\n' }));
    });

    it('should reject if Parser throws inside transform', async () => {
      const { writable } = makeWritableCollector();
      const error = new Error('parse failure');
      mockParse.mockImplementation(() => {
        throw error;
      });

      const data: Sample[] = [{ a: 1, b: 'x' }];

      // Pipe error should cause the returned promise to reject
      await expect(
        WriteCsvToFile(data, writable, { csvOptions: { eol: '\n' } } as any)
      ).rejects.toBe(error);
    });

    it('should pass through transforms and fields to Parser on each chunk', async () => {
      const { writable } = makeWritableCollector();
      mockParse.mockReturnValue('row');
      const transforms = [{ fn: 't' }];
      const fields = ['a', 'b'];

      const data: Sample[] = [{ a: 1, b: 'x' }, { a: 2, b: 'y' }];
      await WriteCsvToFile(data, writable, { csvOptions: { eol: '\n' }, transforms, fields });

      expect(ParserCtor).toHaveBeenCalledTimes(2);
      for (const call of ParserCtor.mock.calls) {
        expect(call[0]).toEqual(expect.objectContaining({ transforms, fields }));
      }
    });
  });
});