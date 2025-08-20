/* Jest + NestJS unit tests for IndicadoresService.
   Framework: Jest (@nestjs/testing) */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, Logger } from '@nestjs/common';
import { Readable } from 'stream';

type PessoaFromJwt = any;
type FileOutput = { name: string; localFile?: string; buffer?: Buffer };
type Regiao = {
  id: number; codigo: string; descricao: string; nivel: number; parente_id: number | null; pdm_codigo_sufixo?: string | null
};
type CreateRelIndicadorDto = any;
type CreateRelIndicadorRegioesDto = any;
type ReportContext = {
  getTmpFile: (name: string) => { path: string };
  progress: (n: number) => Promise<void>;
  resumoSaida: (label: string, count: number) => Promise<void>;
};

class FakePrisma {
  indicador = { findMany: jest.fn() };
  pdm = { findUniqueOrThrow: jest.fn() };
  regiao = { findMany: jest.fn() };
  $queryRawUnsafe = jest.fn();
}

const BATCH_SIZE = 1000;

class IndicadoresService {
  // Injected
  constructor(public prisma: any, public logger: Logger = new Logger('IndicadoresService')) {}

  // Methods under test (only signatures here to allow test compilation; real implementations exist in service)
  private async filtraIndicadores(dto: CreateRelIndicadorDto, user: PessoaFromJwt | null) { return []; }
  async toFileOutput(params: CreateRelIndicadorDto, ctx: ReportContext, user: PessoaFromJwt | null): Promise<FileOutput[]> { return []; }
  private async processDadosIndicadores(indicadores: { id: number }[], params: CreateRelIndicadorDto, camposMetaIniAtv: any[], filePath: string): Promise<number> { return 0; }
  private getDataExpression(params: CreateRelIndicadorDto): string { return ''; }
  private getJanelaExpression(params: CreateRelIndicadorDto): string { return ''; }
  private async processDadosRegioes(indicadores: { id: number }[], params: CreateRelIndicadorRegioesDto, camposMetaIniAtv: any[], filePath: string): Promise<number> { return 0; }
  private async executeSqlAndWriteToFile(query: string, fileStream: any, regioesDb: Regiao[] | null, fields: any[], params: any[], isRegioes: boolean = false): Promise<number> { return 0; }
  private processRowForCsv(row: any, regioesDb: Regiao[] | null): Record<string, any> { return {}; }
  private createCsvLine(flatItem: Record<string, any>, fields: any[], isRegioes: boolean = false): string { return ''; }
  private escapeCsvField(value: any): string { return ''; }
  private flattenObject(item: any): Record<string, any> { return {}; }
  private async streamRowsInto(regioesDb: Regiao[] | null, stream: Readable, prismaTxn: any) {}
  convertRowsRegiao(regioesDb: Regiao[], db: any): any { return {}; }
  render_regiao(regiao_by_id: Record<number, Regiao>, regiao_id: number | null) { return null; }
}

describe('IndicadoresService (diff-focused)', () => {
  let service: any;
  let prisma: FakePrisma;
  let ctx: ReportContext;

  beforeEach(async () => {
    prisma = new FakePrisma();
    service = new IndicadoresService(prisma, new Logger('test'));

    ctx = {
      getTmpFile: (name: string) => ({ path: `/tmp/${name}` }),
      progress: jest.fn().mockResolvedValue(undefined),
      resumoSaida: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('getDataExpression', () => {
    it('returns consolidated annual expression', () => {
      const params = { periodo: 'Anual', tipo: 'Consolidado' };
      const expr = (service as any).getDataExpression(params);
      expect(expr).toContain("dt.dt::date - '11 months'");
    });

    it('returns consolidated/analytic semestral expression', () => {
      const params = { periodo: 'Semestral', tipo: 'Consolidado' };
      const expr = (service as any).getDataExpression(params);
      expect(expr).toContain("dt.dt::date - '5 months'");
      const expr2 = (service as any).getDataExpression({ periodo: 'Semestral', tipo: 'Analitico' });
      expect(expr2).toContain("dt.dt::date - '5 months'");
    });

    it('defaults to simple date', () => {
      const expr = (service as any).getDataExpression({ periodo: 'Anual', tipo: 'Analitico' });
      expect(expr).toBe('dt.dt::date::text');
    });
  });

  describe('getJanelaExpression', () => {
    it('returns 12 for annual consolidated', () => {
      expect((service as any).getJanelaExpression({ periodo: 'Anual', tipo: 'Consolidado' })).toBe('12');
    });
    it('returns 6 for semestral consolidated/analytic', () => {
      expect((service as any).getJanelaExpression({ periodo: 'Semestral', tipo: 'Consolidado' })).toBe('6');
      expect((service as any).getJanelaExpression({ periodo: 'Semestral', tipo: 'Analitico' })).toBe('6');
    });
    it('returns periodicidade expression otherwise', () => {
      expect((service as any).getJanelaExpression({ periodo: 'Anual', tipo: 'Analitico' })).toContain("extract('month'");
    });
  });

  describe('escapeCsvField', () => {
    it('returns empty for null/undefined', () => {
      expect((service as any).escapeCsvField(null)).toBe('');
      expect((service as any).escapeCsvField(undefined)).toBe('');
    });
    it('joins arrays with ; and escapes properly', () => {
      expect((service as any).escapeCsvField(['a','b','c'])).toBe('a;b;c');
      expect((service as any).escapeCsvField(['a,b','c'])).toBe('"a,b;c"');
    });
    it('quotes when containing comma, quote, newline', () => {
      expect((service as any).escapeCsvField('a,b')).toBe('"a,b"');
      expect((service as any).escapeCsvField('a"b')).toBe('"a""b"');
      expect((service as any).escapeCsvField('a\nb')).toBe('"a\nb"');
    });
    it('passes through simple strings', () => {
      expect((service as any).escapeCsvField('abc')).toBe('abc');
      expect((service as any).escapeCsvField(123)).toBe('123');
    });
  });

  describe('createCsvLine', () => {
    const baseFlat = {
      'indicador.codigo': 'IND-1',
      data_referencia: '2024-01-01',
      serie: 'Realizado',
      data: '2024-01-01',
      valor: '10',
      'variavel.orgao.sigla': 'ORG',
      valor_categorica: 'ALTA'
    };

    it('maps field objects and names, with standard fields', () => {
      const fields = [
        { value: 'indicador.codigo', label: 'Indicador Código' },
        'variavel.orgao.sigla'
      ];
      const line = (service as any).createCsvLine(baseFlat, fields, false);
      // Expected: field1, field2, data_ref, serie, data, valor
      const parts = line.split(',');
      expect(parts.length).toBe(6);
      expect(parts[0]).toBe('IND-1');
      expect(parts[1]).toBe('ORG');
      expect(parts[2]).toBe('2024-01-01');
      expect(parts[3]).toBe('Realizado');
      expect(parts[4]).toBe('2024-01-01');
      expect(parts[5]).toBe('10');
    });

    it('adds valor_categorica when isRegioes', () => {
      const fields = [ 'variavel.orgao.sigla' ];
      const line = (service as any).createCsvLine(baseFlat, fields, true);
      const parts = line.split(',');
      expect(parts.length).toBe(6 + 1);
      expect(parts[6]).toBe('ALTA');
    });

    it('handles undefined/null values as empty', () => {
      const line = (service as any).createCsvLine({}, ['x','y'], true);
      const parts = line.split(',');
      expect(parts).toEqual(['','','','','','', '']);
    });
  });

  describe('flattenObject', () => {
    it('flattens nested structures as specified', () => {
      const item = {
        pdm_nome: 'PDM',
        data: '2024-01-01',
        data_referencia: '2024-01-01',
        serie: 'Realizado',
        valor: 12.34,
        valor_categorica: 'ALTA',
        regiao_id: 44,
        indicador: { codigo: 'I1', titulo: 'Tit', contexto: 'Ctx', complemento: 'Comp', id: 5 },
        meta: { codigo: 'M1', titulo: 'Meta', id: 7 },
        meta_tags: ['t1','t2'],
        iniciativa: { codigo: 'A', titulo: 'Ini', id: 8 },
        atividade: { codigo: 'B', titulo: 'Atv', id: 9 },
        variavel: { codigo: 'V1', titulo: 'Var', id: 11, orgao: { id: 22, sigla: 'ORG' } },
        regiao_nivel_2: { id: 2, codigo: 'R2' }
      };
      const flat = (service as any).flattenObject(item);
      expect(flat['pdm_nome']).toBe('PDM');
      expect(flat['indicador.codigo']).toBe('I1');
      expect(flat['meta.id']).toBe(7);
      expect(flat['meta_tags']).toEqual(['t1','t2']);
      expect(flat['variavel.orgao.sigla']).toBe('ORG');
      expect(flat['regiao_nivel_2.id']).toBe(2);
    });
  });

  describe('render_regiao', () => {
    const r = (id: number, nivel: number, parent: number | null, codigo = `C${id}`, descricao = `D${id}`): Regiao => ({
      id, nivel, parente_id: parent, codigo, descricao, pdm_codigo_sufixo: null
    });
    it('returns null for falsy or missing id', () => {
      expect(service.render_regiao({}, null)).toBeNull();
      expect(service.render_regiao({}, 123)).toBeNull();
    });
    it('renders region dto correctly', () => {
      const map: Record<number, Regiao> = { 1: r(1,1,null) };
      const dto = service.render_regiao(map, 1);
      expect(dto).toEqual(expect.objectContaining({ id: 1, nivel: 1, codigo: 'C1', descricao: 'D1' }));
    });
  });

  describe('convertRowsRegiao', () => {
    const reg = (id: number, nivel: number, parent: number | null): Regiao => ({
      id, nivel, parente_id: parent, codigo: `C${id}`, descricao: `D${id}`, pdm_codigo_sufixo: null
    });

    it('maps chain when nivel 4', () => {
      const regioes = [
        reg(1,1,null),
        reg(2,2,1),
        reg(3,3,2),
        reg(4,4,3),
      ];
      const out = service.convertRowsRegiao(regioes, { regiao_id: 4 } as any);
      expect(out.regiao_nivel_4?.id).toBe(4);
      expect(out.regiao_nivel_3?.id).toBe(3);
      expect(out.regiao_nivel_2?.id).toBe(2);
      expect(out.regiao_nivel_1?.id).toBe(1);
      expect(out.regiao_id).toBe(4);
    });

    it('maps chain when nivel 3', () => {
      const regioes = [
        reg(1,1,null),
        reg(2,2,1),
        reg(3,3,2),
      ];
      const out = service.convertRowsRegiao(regioes, { regiao_id: 3 } as any);
      expect(out.regiao_nivel_4).toBeNull();
      expect(out.regiao_nivel_3?.id).toBe(3);
      expect(out.regiao_nivel_2?.id).toBe(2);
      expect(out.regiao_nivel_1?.id).toBe(1);
    });

    it('handles missing chain gracefully', () => {
      const regioes = [ reg(2,2,1) ];
      const out = service.convertRowsRegiao(regioes, { regiao_id: 2 } as any);
      expect(out.regiao_nivel_1).toBeNull(); // parent missing
      expect(out.regiao_nivel_2?.id).toBe(2);
    });
  });

  describe('executeSqlAndWriteToFile (behavioral via mocks)', () => {
    it('writes rows, parses valor_json string/object, continues on row error', async () => {
      const logSpy = jest.spyOn(service.logger, 'debug').mockImplementation(() => {});
      const warnSpy = jest.spyOn(service.logger, 'warn').mockImplementation(() => {});
      const errorSpy = jest.spyOn(service.logger, 'error').mockImplementation(() => {});
      // First batch returns two rows, second batch empty
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([
          {
            pdm_nome: 'PDM', indicador_id: 1, indicador_codigo: 'I1', indicador_titulo: 'T1',
            meta_id: 2, meta_codigo: 'M1', meta_titulo: 'MT1', meta_tags: ['x','y'],
            iniciativa_id: null, atividade_id: null,
            indicador_complemento: null, indicador_contexto: 'CTX',
            data: '2024-01-01', data_referencia: '2024-01-01', serie: 'Realizado',
            valor_json: JSON.stringify({ valor_nominal: 5, valor_categorica: 'ALTA' })
          },
          {
            pdm_nome: 'PDM', indicador_id: 1, indicador_codigo: 'I1', indicador_titulo: 'T1',
            meta_id: null, meta_codigo: null, meta_titulo: null, meta_tags: null,
            iniciativa_id: null, atividade_id: null,
            indicador_complemento: null, indicador_contexto: 'CTX',
            data: '2024-02-01', data_referencia: '2024-02-01', serie: 'Realizado',
            valor_json: { valor_nominal: 7, valor_categorica: 'BAIXA' }
          }
        ])
        .mockResolvedValueOnce([]); // terminate

      // Fake fileStream
      const lines: string[] = [];
      const fileStream = {
        write: (s: string) => { lines.push(s.replace(/\n+$/,'')); },
        end: () => {}
      };

      const query = 'select * from x';
      const fields = ['pdm_nome'];
      const count = await (service as any).executeSqlAndWriteToFile(query, fileStream, null, fields, ['2024-01-01','2024-12-01','1 month'], false);
      expect(count).toBe(2);
      // Header not handled here; executeSqlAndWriteToFile writes only data lines.
      // But we can assert last line has expected standard fields count (1 field + 4 std = 5)
      const lastCols = lines[lines.length-1].split(',');
      expect(lastCols.length).toBe(1 + 4);
      expect(lines.join('\n')).toContain('BAIXA'); // valor_categorica flattening passed to createCsvLine only for regioes, but processedRow keeps it.

      expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore(); warnSpy.mockRestore(); errorSpy.mockRestore();
    });

    it('logs and throws on first batch failure', async () => {
      prisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('DB down'));
      const fileStream = { write: jest.fn(), end: jest.fn() };
      await expect((service as any).executeSqlAndWriteToFile('q', fileStream, null, [], [], false))
        .rejects.toThrow('DB down');
    });
  });

  describe('toFileOutput guards', () => {
    it('throws when tipo=Mensal without mes', async () => {
      await expect(service.toFileOutput({ tipo: 'Mensal', periodo: 'Anual', ano: 2024 }, ctx, null))
        .rejects.toThrow(HttpException);
    });

    it('throws when periodo=Mensal and tipo!==Geral', async () => {
      await expect(service.toFileOutput({ periodo: 'Mensal', tipo: 'Analitico', mes: '01', ano: 2024 }, ctx, null))
        .rejects.toThrow(HttpException);
    });
  });
});