// `PrismaService` arrasta `prisma-field-encryption` → `chevrotain`, que é ESM puro e o jest deste
// projeto não transforma. O service só recebe o prisma por injeção (aqui, um mock), então a classe
// real nunca é usada — basta impedir que o módulo seja carregado.
jest.mock('../../prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));

import { HttpException } from '@nestjs/common';
import { FonteRelatorio, ModuloSistema } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import {
    RelatorioModeloConfigDto,
    RelatorioModeloDirecao,
    RelatorioModeloFiltroOp,
} from '../post-process/dto/relatorio-modelo.dto';
import { ReportColumn, ReportRows } from '../post-process/report-column.decorator';
import { ReportFileSchema } from '../post-process/report-schema';
import { RelatorioArquivoColunasDto, RelatorioModeloColunasDto } from './entities/relatorio-modelo.entity';
import { RelatorioModeloService } from './relatorio-modelo.service';

/**
 * `listColunasDoModelo` responde "o que este modelo vai me dar" para quem vai *rodar* o
 * relatório, e o que ela devolve precisa bater com o que o pós-processamento entrega — por isso
 * as duas compartilham `resolverColunasDoModelo`. Estes testes cobrem o que é só desta rota: a
 * escolha do schema de referência (união × parâmetros), o `incluir: false` e a separação entre
 * recorte esperado e coluna que a fonte não declara mais.
 */

const ARQUIVO = 'fixture-modelo-colunas.csv';
const FONTE = FonteRelatorio.Transferencias;
const SISTEMA: ModuloSistema = 'CasaCivil';

// O decorador registra a classe no registro global — é assim que `arquivosDaFonte` enxerga a
// união das colunas da fonte. Nome de arquivo próprio para não colidir com os reais.
@ReportRows({ arquivo: ARQUIVO, fontes: [FONTE], descricao: 'Fixture de teste' })
class FixtureRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID', descricao: 'Identificador' })
    id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto' })
    objeto: string;

    @ReportColumn({ type: 'DATE', label: 'Vigência' })
    vigencia: Date;

    /** Só existe em uma das variantes da fonte — é a coluna que a execução recorta. */
    @ReportColumn({ type: 'VARCHAR', label: 'Título da Meta' })
    meta__titulo: string;
}
void FixtureRow;

/** Schema de uma execução que não tem a variante de meta. */
const SCHEMA_EXECUCAO: ReportFileSchema = {
    arquivo: ARQUIVO,
    colunas: [
        { name: 'id', type: 'BIGINT', label: 'ID' },
        { name: 'objeto', type: 'VARCHAR', label: 'Objeto' },
        { name: 'vigencia', type: 'DATE', label: 'Vigência' },
    ],
};

function fazerUser(privilegios: ListaDePrivilegios[]): PessoaFromJwt {
    const concedidos = new Set<string>(privilegios);
    return {
        id: 42,
        orgao_id: 7,
        assertOneModuloSistema: () => SISTEMA,
        hasSomeRoles: (privs: ListaDePrivilegios[]) => privs.some((p) => concedidos.has(p)),
    } as unknown as PessoaFromJwt;
}

type Mocks = {
    service: RelatorioModeloService;
    findFirst: jest.Mock;
    describeSchemaDaFonte: jest.Mock;
};

function fazerService(config: RelatorioModeloConfigDto | null): Mocks {
    const findFirst = jest
        .fn()
        .mockResolvedValue(config === null ? null : { id: 1, nome: 'Modelo de teste', fonte: FONTE, config });
    const describeSchemaDaFonte = jest.fn().mockResolvedValue(null);

    const service = new RelatorioModeloService(
        { relatorioModelo: { findFirst } } as never,
        { describeSchemaDaFonte } as never
    );

    return { service, findFirst, describeSchemaDaFonte };
}

const USER = fazerUser(['Reports.executar.CasaCivil']);

/** O registro global tem os arquivos reais da fonte junto do fixture; só o fixture interessa. */
function doFixture(r: RelatorioModeloColunasDto): RelatorioArquivoColunasDto | undefined {
    return r.arquivos.find((a) => a.arquivo === ARQUIVO);
}

describe('listColunasDoModelo', () => {
    it('sem parâmetros, recorta contra a união da fonte e aplica ordem e rótulo do modelo', async () => {
        const { service } = fazerService({
            arquivos: [
                {
                    arquivo: ARQUIVO,
                    colunas: [{ coluna: 'objeto', label: 'Descrição do objeto' }, { coluna: 'id' }],
                },
            ],
        });

        const r = await service.listColunasDoModelo(1, undefined, USER);

        expect(r.modelo_id).toBe(1);
        expect(r.modelo_nome).toBe('Modelo de teste');
        expect(r.fonte).toBe(FONTE);
        expect(r.parametrizado).toBe(false);

        const arq = doFixture(r);
        expect(arq!.colunas.map((c) => c.name)).toEqual(['objeto', 'id']);
        expect(arq!.colunas[0].label).toBe('Descrição do objeto');
        // Rótulo não sobrescrito mantém o do schema, e a descrição vem do decorador.
        expect(arq!.colunas[1].label).toBe('ID');
        expect(arq!.colunas[1].descricao).toBe('Identificador');

        // Contra a própria união não há o que recortar.
        expect(r.colunas_recortadas).toEqual([]);
        expect(r.referencias_ignoradas).toEqual([]);
    });

    it('arquivo com incluir:false sai da lista e entra em arquivos_descartados', async () => {
        const { service } = fazerService({
            arquivos: [{ arquivo: ARQUIVO, incluir: false, colunas: [{ coluna: 'id' }] }],
        });

        const r = await service.listColunasDoModelo(1, undefined, USER);

        expect(r.arquivos_descartados).toContain(ARQUIVO);
        expect(doFixture(r)).toBeUndefined();
    });

    it('arquivo não citado no modelo vem com o schema inteiro, igual ao pós-processamento', async () => {
        const { service } = fazerService({ arquivos: [{ arquivo: 'outro-arquivo.csv' }] });

        const r = await service.listColunasDoModelo(1, undefined, USER);

        expect(doFixture(r)!.colunas.map((c) => c.name)).toEqual(['id', 'objeto', 'vigencia', 'meta__titulo']);
    });

    it('com parâmetros, separa recorte esperado de coluna que a fonte não declara mais', async () => {
        const { service, describeSchemaDaFonte } = fazerService({
            arquivos: [
                {
                    arquivo: ARQUIVO,
                    colunas: [
                        { coluna: 'id' },
                        { coluna: 'meta__titulo' }, // existe na fonte, não nesta execução → recortada
                        { coluna: 'coluna_extinta' }, // a fonte não declara mais → ignorada
                    ],
                },
            ],
        });
        describeSchemaDaFonte.mockResolvedValue([SCHEMA_EXECUCAO]);

        const r = await service.listColunasDoModelo(1, { ano: 2026 }, USER);

        expect(describeSchemaDaFonte).toHaveBeenCalledWith(FONTE, { ano: 2026 }, SISTEMA);
        expect(r.parametrizado).toBe(true);
        expect(doFixture(r)!.colunas.map((c) => c.name)).toEqual(['id']);

        expect(r.colunas_recortadas).toEqual([{ arquivo: ARQUIVO, onde: 'colunas', coluna: 'meta__titulo' }]);
        expect(r.referencias_ignoradas).toEqual([{ arquivo: ARQUIVO, onde: 'colunas', coluna: 'coluna_extinta' }]);
    });

    it('registra referências quebradas de filtros e order_by', async () => {
        const { service, describeSchemaDaFonte } = fazerService({
            arquivos: [
                {
                    arquivo: ARQUIVO,
                    colunas: [{ coluna: 'id' }],
                    filtros: [{ coluna: 'meta__titulo', op: RelatorioModeloFiltroOp.eq, valor: 'x' }],
                    order_by: [{ coluna: 'coluna_extinta', direcao: RelatorioModeloDirecao.ASC }],
                },
            ],
        });
        describeSchemaDaFonte.mockResolvedValue([SCHEMA_EXECUCAO]);

        const r = await service.listColunasDoModelo(1, {}, USER);

        expect(r.colunas_recortadas).toContainEqual({ arquivo: ARQUIVO, onde: 'filtros', coluna: 'meta__titulo' });
        expect(r.referencias_ignoradas).toContainEqual({
            arquivo: ARQUIVO,
            onde: 'order_by',
            coluna: 'coluna_extinta',
        });
    });

    it('cai na união quando a fonte não sabe descrever o schema dos parâmetros', async () => {
        const { service, describeSchemaDaFonte } = fazerService({
            arquivos: [{ arquivo: ARQUIVO, colunas: [{ coluna: 'meta__titulo' }] }],
        });
        describeSchemaDaFonte.mockResolvedValue(null);

        const r = await service.listColunasDoModelo(1, {}, USER);

        // Superconjunto em vez de resposta vazia — e `parametrizado: false` avisa que não é o
        // recorte exato daquela execução.
        expect(r.parametrizado).toBe(false);
        expect(doFixture(r)!.colunas.map((c) => c.name)).toEqual(['meta__titulo']);
    });

    it('modelo fora da visibilidade do usuário é 404', async () => {
        const { service } = fazerService(null);

        await expect(service.listColunasDoModelo(1, undefined, USER)).rejects.toThrow(HttpException);
    });
});
