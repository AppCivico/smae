import {
    MonitoramentoFaseLeituraDto,
    MonitoramentoFaseRevisaoLeituraDto,
} from '../../pdm-ciclo/entities/ps-ciclo-fase.entity';
import { montaLinhasFasesCsv } from './monitoramento-fases-csv';

function fase(
    ordem: number,
    rotulo: string,
    blocos: { id: number; ordem: number; rotulo: string }[],
    extra: Partial<MonitoramentoFaseLeituraDto> = {},
    aceita_tags = false
): MonitoramentoFaseLeituraDto {
    return {
        config: { id: ordem, ordem, rotulo, aceita_tags, aceita_anexos: false, fecha_ciclo: false, blocos },
        revisao: null,
        documentos: [],
        ...extra,
    };
}

function revisao(extra: Partial<MonitoramentoFaseRevisaoLeituraDto>): MonitoramentoFaseRevisaoLeituraDto {
    return {
        id: 99,
        fecha_ciclo: false,
        automatico: false,
        comentario_sistema: null,
        referencia_data: '2027-03-01',
        criado_em: new Date('2027-03-05T10:00:00.000Z'),
        criador: { id: 1, nome_exibicao: 'Fulano' },
        reaberto_em: null,
        reaberto_por: null,
        blocos: [],
        tags: [],
        ...extra,
    };
}

describe('montaLinhasFasesCsv', () => {
    const meta = {
        meta_id: 7,
        meta_codigo: 'M7',
        meta_titulo: 'Meta 7',
        data_ciclo: '2027-03-01',
        ciclo_fechado: true,
    };

    it('gera uma linha por bloco habilitado e uma linha para fase sem blocos', () => {
        const linhas = montaLinhasFasesCsv([
            {
                ...meta,
                fases: [
                    fase(
                        1,
                        'Análise',
                        [
                            { id: 10, ordem: 1, rotulo: 'A' },
                            { id: 11, ordem: 2, rotulo: 'B' },
                        ],
                        {
                            revisao: revisao({
                                blocos: [{ bloco_id: 11, rotulo: 'B', conteudo: '<p>b</p>', conteudo_texto: 'b' }],
                            }),
                            documentos: [{ id: 1, descricao: null, nome_original: 'x.pdf' }],
                        }
                    ),
                    fase(2, 'Tags', [], {}, true),
                ],
            },
        ]);

        expect(linhas.map((l) => [l.fase_rotulo, l.bloco_rotulo, l.conteudo, l.revisao_id])).toEqual([
            ['Análise', 'A', null, 99],
            ['Análise', 'B', 'b', 99],
            ['Tags', null, null, null],
        ]);
        expect(linhas[0]).toMatchObject({
            ciclo_fechado: 'Sim',
            criado_em: '2027-03-05T10:00:00.000Z',
            criador: 'Fulano',
            documentos_qtde: 1,
        });
    });

    it('junta as tags com "; "', () => {
        const tags = [
            { id: 1, descricao: 'Alfa' },
            { id: 2, descricao: 'Beta' },
        ];
        const [linha] = montaLinhasFasesCsv([
            { ...meta, fases: [fase(1, 'Tags', [], { revisao: revisao({ tags }) }, true)] },
        ]);
        expect(linha.tags).toBe('Alfa; Beta');
    });

    it('plano sem fases não gera linhas', () => {
        expect(montaLinhasFasesCsv([{ ...meta, fases: [] }])).toEqual([]);
    });
});
